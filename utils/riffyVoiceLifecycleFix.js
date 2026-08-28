const { Riffy } = require('riffy');

const PLAYER_UPDATE_STALE_MS = 18000;
const WATCHDOG_INTERVAL_MS = 6000;
const HEARTBEAT_LOG_MS = 30000;

function getTrackKey(track) {
    return track?.info?.identifier || track?.info?.uri || track?.track || null;
}

function attachNodeSocketActivity(node) {
    if (!node) return;

    // Riffy 1.0.12 can keep node.connected=true even when the websocket stops
    // delivering useful player events. Track real websocket traffic separately.
    const attach = () => {
        const ws = node.ws;
        if (!ws || ws.__dfordogActivityListenerInstalled) return;

        Object.defineProperty(ws, '__dfordogActivityListenerInstalled', {
            value: true,
            configurable: true
        });

        node.__dfordogLastWsPayloadAt = Date.now();
        ws.on('open', () => {
            node.__dfordogLastWsPayloadAt = Date.now();
        });
        ws.on('message', () => {
            node.__dfordogLastWsPayloadAt = Date.now();
        });
    };

    if (!node.__dfordogConnectActivityPatchInstalled && typeof node.connect === 'function') {
        const originalConnect = node.connect.bind(node);
        node.connect = function(...args) {
            // autoResume in Riffy 1.0.12 calls player.restart(), but Player has no
            // restart() method. Lavalink v4 session resuming already preserves the
            // remote player, so disable only this broken client-side restart path.
            this.autoResume = false;
            const result = originalConnect(...args);
            attach();
            return result;
        };
        node.__dfordogConnectActivityPatchInstalled = true;
    }

    node.autoResume = false;
    attach();
}

function patchPlayerPlaybackTracking(player) {
    if (!player || player.__dfordogPlaybackTrackingInstalled || typeof player.play !== 'function') return;

    const originalPlay = player.play.bind(player);
    player.play = async function(...args) {
        const result = await originalPlay(...args);
        this.__dfordogPlaybackExpectedAt = Date.now();
        return result;
    };

    player.__dfordogPlaybackTrackingInstalled = true;
}

function installRiffyInstanceRecovery(riffy) {
    if (!riffy || riffy.__dfordogEventRecoveryInstalled) return;

    const lastPlayerUpdate = new Map();
    const lastObservedTrack = new Map();
    const lastHeartbeatLog = new Map();
    const lastForcedRecovery = new Map();

    const markPlayer = (player) => {
        if (!player) return;
        patchPlayerPlaybackTracking(player);
        attachNodeSocketActivity(player.node);
    };

    if (riffy.players?.values) {
        for (const player of riffy.players.values()) markPlayer(player);
    }
    if (riffy.nodeMap?.values) {
        for (const node of riffy.nodeMap.values()) attachNodeSocketActivity(node);
    }

    riffy.on('nodeCreate', (node) => attachNodeSocketActivity(node));
    riffy.on('nodeConnect', (node) => {
        attachNodeSocketActivity(node);
        node.__dfordogLastWsPayloadAt = Date.now();
    });

    riffy.on('playerCreate', (player) => markPlayer(player));

    riffy.on('trackStart', (player, track) => {
        markPlayer(player);
        const guildId = player?.guildId;
        if (!guildId) return;

        lastPlayerUpdate.set(guildId, Date.now());
        lastObservedTrack.set(guildId, getTrackKey(track));
        player.__dfordogPlaybackExpectedAt = Date.now();
    });

    riffy.on('playerUpdate', (player, packet) => {
        const guildId = player?.guildId;
        if (!guildId) return;

        markPlayer(player);
        lastPlayerUpdate.set(guildId, Date.now());

        const track = player.current;
        const trackKey = getTrackKey(track);
        if (!trackKey || !track?.info || player.playing !== true || packet?.state?.connected === false) return;

        // Normally trackStart updates the status immediately. If the Lavalink
        // event stream misses TrackStartEvent but playerUpdate still arrives,
        // recover the Discord presence/voice status from player.current.
        if (lastObservedTrack.get(guildId) !== trackKey) {
            const statusManager = riffy.client?.statusManager;
            if (statusManager?.onTrackStart) {
                lastObservedTrack.set(guildId, trackKey);
                console.warn(`[ RIFFY STATUS ] Missed trackStart detected for guild ${guildId}; recovering status from playerUpdate (${track.info.title}).`);
                Promise.resolve(
                    statusManager.onTrackStart(guildId, track.info.title, player.voiceChannel)
                ).catch((error) => {
                    lastObservedTrack.delete(guildId);
                    console.warn(`[ RIFFY STATUS ] Status recovery failed for guild ${guildId}: ${error?.message || error}`);
                });
            }
        }
    });

    const clearGuild = (player) => {
        const guildId = player?.guildId;
        if (!guildId) return;
        lastPlayerUpdate.delete(guildId);
        lastObservedTrack.delete(guildId);
        lastHeartbeatLog.delete(guildId);
        lastForcedRecovery.delete(guildId);
    };

    riffy.on('playerDisconnect', clearGuild);

    const watchdog = setInterval(() => {
        const now = Date.now();

        for (const player of riffy.players?.values?.() || []) {
            if (!player?.guildId || player.playing !== true || player.paused === true || !player.current) continue;

            markPlayer(player);
            const guildId = player.guildId;
            const node = player.node;
            const lastUpdateAt = lastPlayerUpdate.get(guildId) || player.__dfordogPlaybackExpectedAt || now;
            const updateAge = now - lastUpdateAt;

            if (now - (lastHeartbeatLog.get(guildId) || 0) >= HEARTBEAT_LOG_MS) {
                const wsState = node?.ws?.readyState;
                console.log(`[ RIFFY WATCH ] guild=${guildId} playing=true playerUpdateAge=${Math.round(updateAge / 1000)}s wsState=${wsState ?? 'none'} nodeConnected=${node?.connected === true} current=${player.current?.info?.title || 'unknown'}`);
                lastHeartbeatLog.set(guildId, now);
            }

            // Lavalink's default playerUpdate interval is 5 seconds. Missing more
            // than 18 seconds while a track is actively playing means the event
            // channel is stale even if REST requests still work.
            if (updateAge < PLAYER_UPDATE_STALE_MS) continue;
            if (now - (lastForcedRecovery.get(guildId) || 0) < PLAYER_UPDATE_STALE_MS) continue;

            lastForcedRecovery.set(guildId, now);
            console.warn(`[ RIFFY WATCH ] Event stream stalled for guild ${guildId} (${Math.round(updateAge / 1000)}s without playerUpdate). Forcing Lavalink websocket reconnect while preserving the Riffy instance.`);

            try {
                if (node?.ws && typeof node.ws.terminate === 'function') {
                    node.ws.terminate();
                } else if (node && typeof node.reconnect === 'function') {
                    node.connected = false;
                    node.reconnect();
                } else if (node && typeof node.connect === 'function') {
                    node.connected = false;
                    node.connect();
                }
            } catch (error) {
                console.warn(`[ RIFFY WATCH ] Websocket recovery failed for guild ${guildId}: ${error?.message || error}`);
            }
        }
    }, WATCHDOG_INTERVAL_MS);

    watchdog.unref?.();

    riffy.__dfordogEventRecoveryInstalled = true;
    riffy.__dfordogEventRecoveryWatchdog = watchdog;
    console.log('[ RIFFY WATCH ] Event-stream watchdog installed (playerUpdate heartbeat + status reconciliation).');
}

/**
 * Compatibility/recovery patch for Riffy 1.0.12.
 *
 * 1) Allow legitimate destroy() after Discord reports channel_id=null.
 * 2) Remove disconnected/zombie guild players before createConnection().
 * 3) Recover a silent Lavalink websocket event stream.
 * 4) Reconcile Discord status from playerUpdate when TrackStartEvent is missed.
 */
function installRiffyVoiceLifecycleFix() {
    if (!Riffy?.prototype || Riffy.prototype.__dfordogVoiceLifecycleFixInstalled) return;

    const originalUpdateVoiceState = Riffy.prototype.updateVoiceState;
    const originalCreateConnection = Riffy.prototype.createConnection;
    const originalInit = Riffy.prototype.init;
    const originalCreateNode = Riffy.prototype.createNode;

    Riffy.prototype.updateVoiceState = async function(packet) {
        const isBotVoiceDisconnect = packet?.t === 'VOICE_STATE_UPDATE' &&
            packet?.d?.user_id === this.clientId &&
            packet?.d?.channel_id == null;

        if (isBotVoiceDisconnect) {
            const guildId = packet.d.guild_id;
            const player = this.players?.get(guildId);

            if (player) {
                player.__discordVoiceDisconnectAt = Date.now();
                player.__wasPlayingBeforeDiscordDisconnect = player.playing === true;
                player.playing = false;
                player.paused = false;
                player.connected = false;

                console.warn(`[ RIFFY VOICE ] Discord confirmed voice disconnect for guild ${guildId}; allowing Riffy cleanup.`);
            }
        }

        return originalUpdateVoiceState.call(this, packet);
    };

    Riffy.prototype.createNode = function(options) {
        const node = originalCreateNode.call(this, options);
        attachNodeSocketActivity(node);
        return node;
    };

    Riffy.prototype.init = function(...args) {
        const result = originalInit.apply(this, args);
        installRiffyInstanceRecovery(this);
        return result;
    };

    Riffy.prototype.createConnection = function(options) {
        const guildId = options?.guildId;
        const existingPlayer = guildId ? this.players?.get(guildId) : null;

        const stalePlayer = existingPlayer && (
            existingPlayer.destroyed === true ||
            existingPlayer.connected === false ||
            !existingPlayer.connection
        );

        if (stalePlayer) {
            console.warn(`[ RIFFY VOICE ] Removing stale player before createConnection for guild ${guildId}; connected=${existingPlayer.connected === true} destroyed=${existingPlayer.destroyed === true}.`);

            try {
                existingPlayer.playing = false;
                existingPlayer.paused = false;
                existingPlayer.destroy();
            } catch (error) {
                console.warn(`[ RIFFY VOICE ] Stale player destroy failed for guild ${guildId}: ${error?.message || error}`);
            } finally {
                this.players?.delete(guildId);
            }
        }

        const player = originalCreateConnection.call(this, options);
        patchPlayerPlaybackTracking(player);
        attachNodeSocketActivity(player?.node);
        return player;
    };

    Object.defineProperty(Riffy.prototype, '__dfordogVoiceLifecycleFixInstalled', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
    });

    console.log('[ RIFFY VOICE ] Lifecycle recovery patch installed (disconnect + zombie cleanup + event watchdog).');
}

function installLavalinkManagerRecovery() {
    let lavalinkModule;
    try {
        lavalinkModule = require('../lavalink.js');
    } catch (error) {
        console.warn(`[ LAVALINK ][RECOVERY] Unable to preload manager recovery: ${error?.message || error}`);
        return;
    }

    const originalInitialize = lavalinkModule.initializeLavalinkManager;
    if (typeof originalInitialize !== 'function' || originalInitialize.__dfordogWrapped) return;

    const wrappedInitialize = async function(client) {
        const manager = await originalInitialize(client);
        if (!manager || manager.__dfordogRefreshRecoveryInstalled) return manager;

        const originalRefresh = manager.refreshRiffy?.bind(manager);

        manager.refreshRiffy = async function() {
            // Never silently replace a live Riffy object: player.js, lifecycle guards,
            // cards and status listeners are attached to that EventEmitter instance.
            if (this.riffy) {
                this.client.riffy = this.riffy;
                installRiffyInstanceRecovery(this.riffy);

                if (this.hasConnectedNodes()) return true;

                console.warn('[ LAVALINK ][RECOVERY] Reconnecting nodes on the existing Riffy instance; listeners will be preserved.');

                for (const nodeConfig of this.nodes.values()) {
                    let node = this._findRiffyNodeObjectByConfig(nodeConfig);

                    try {
                        if (!node) {
                            node = this.riffy.createNode({
                                host: nodeConfig.host,
                                password: nodeConfig.password,
                                port: nodeConfig.port,
                                secure: !!nodeConfig.secure,
                                name: nodeConfig.id,
                                displayName: nodeConfig.displayName || nodeConfig.name || nodeConfig.id
                            });
                        } else if (!node.connected) {
                            attachNodeSocketActivity(node);
                            if (node.reconnectAttempt) {
                                clearTimeout(node.reconnectAttempt);
                                node.reconnectAttempt = null;
                            }
                            node.reconnectAttempted = 1;
                            node.connect();
                        }
                    } catch (error) {
                        console.warn(`[ LAVALINK ][RECOVERY] Failed reconnecting ${nodeConfig.id}: ${error?.message || error}`);
                    }
                }

                const recovered = await this.waitForConnectedNode(8000).catch(() => false);
                this.client.riffy = this.riffy;
                return recovered || this.hasConnectedNodes();
            }

            // Startup-only fallback. If a manager truly has no Riffy instance yet,
            // let the original initializer recreate it and immediately synchronize
            // client.riffy plus the recovery listeners.
            const result = originalRefresh ? await originalRefresh() : false;
            if (this.riffy) {
                this.client.riffy = this.riffy;
                installRiffyInstanceRecovery(this.riffy);
            }
            return result;
        };

        manager.__dfordogRefreshRecoveryInstalled = true;
        client.riffy = manager.riffy;
        installRiffyInstanceRecovery(manager.riffy);
        console.log('[ LAVALINK ][RECOVERY] Riffy instance-preserving reconnect patch installed.');
        return manager;
    };

    wrappedInitialize.__dfordogWrapped = true;
    lavalinkModule.initializeLavalinkManager = wrappedInitialize;
}

installRiffyVoiceLifecycleFix();
installLavalinkManagerRecovery();

module.exports = {
    installRiffyVoiceLifecycleFix,
    installRiffyInstanceRecovery,
    installLavalinkManagerRecovery
};
