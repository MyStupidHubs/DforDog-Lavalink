const { Riffy } = require('riffy');

const WATCHDOG_INTERVAL_MS = 6000;
const HEARTBEAT_LOG_MS = 30000;
const WS_CONNECTING = 0;
const WS_OPEN = 1;

function getTrackKey(track) {
    return track?.info?.identifier || track?.info?.uri || track?.track || null;
}

function attachNodeSocketActivity(node) {
    if (!node) return;

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
            node.__dfordogLastWsOpenAt = Date.now();
        });
        ws.on('message', () => {
            node.__dfordogLastWsPayloadAt = Date.now();
        });
        ws.on('close', (code) => {
            node.__dfordogLastWsCloseAt = Date.now();
            node.__dfordogLastWsCloseCode = code;
        });
        ws.on('error', (error) => {
            node.__dfordogLastWsError = error?.message || String(error || 'unknown');
        });
    };

    if (!node.__dfordogConnectActivityPatchInstalled && typeof node.connect === 'function') {
        const originalConnect = node.connect.bind(node);
        node.connect = function(...args) {
            // Riffy 1.0.12's Node.open() calls player.restart() when autoResume is
            // enabled, but Player has no restart() method. Lavalink v4 session
            // resuming already preserves the server-side player, so keep this off.
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

function scheduleNativeReconnect(node, reason = 'socket unavailable') {
    if (!node) return false;

    attachNodeSocketActivity(node);
    const wsState = node.ws?.readyState;

    if (node.connected === true && wsState === WS_OPEN) return true;
    if (wsState === WS_CONNECTING) return true;
    if (node.reconnectAttempt) return true;

    node.connected = false;

    try {
        if (typeof node.reconnect === 'function') {
            console.warn(`[ RIFFY WS ] Scheduling native Riffy reconnect for ${node.name || node.host}: ${reason}.`);
            node.reconnect();
            return true;
        }

        // Compatibility fallback for a Riffy build without reconnect(). Only call
        // connect() when there is no live/connecting websocket.
        if (typeof node.connect === 'function' && (!node.ws || node.ws.readyState > WS_OPEN)) {
            console.warn(`[ RIFFY WS ] Reconnecting ${node.name || node.host} directly because reconnect() is unavailable: ${reason}.`);
            node.connect();
            return true;
        }
    } catch (error) {
        console.warn(`[ RIFFY WS ] Reconnect scheduling failed for ${node.name || node.host}: ${error?.message || error}`);
    }

    return false;
}

function installRiffyInstanceRecovery(riffy) {
    if (!riffy || riffy.__dfordogEventRecoveryInstalled) return;

    const lastPlayerUpdate = new Map();
    const lastObservedTrack = new Map();
    const lastHeartbeatLog = new Map();

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

    riffy.on('nodeDisconnect', (node) => {
        attachNodeSocketActivity(node);
        // Do not call connect() here. Riffy Node.close() already calls reconnect().
        console.warn(`[ RIFFY WS ] Node ${node?.name || node?.host || 'unknown'} disconnected; native Riffy reconnect will handle it.`);
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

        // If TrackStartEvent was missed but playerUpdate arrives, repair only the
        // Discord status. This is reconciliation, not a websocket reconnect trigger.
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
    };

    riffy.on('playerDisconnect', clearGuild);

    const watchdog = setInterval(() => {
        const now = Date.now();

        // The old v4 watchdog forcibly terminated a healthy websocket after 18s
        // without playerUpdate. That produced overlapping Riffy/Lavalink sessions.
        // v5 never reconnects based on event silence alone.
        for (const node of riffy.nodeMap?.values?.() || []) {
            attachNodeSocketActivity(node);
            const wsState = node?.ws?.readyState;

            // Repair only an objectively inconsistent socket state. If close() has
            // already scheduled reconnectAttempt, scheduleNativeReconnect is a no-op.
            if (node?.connected === true && wsState !== undefined && wsState !== WS_OPEN) {
                scheduleNativeReconnect(node, `node.connected=true but ws.readyState=${wsState}`);
            }
        }

        for (const player of riffy.players?.values?.() || []) {
            if (!player?.guildId || player.playing !== true || player.paused === true || !player.current) continue;

            markPlayer(player);
            const guildId = player.guildId;
            const node = player.node;
            const lastUpdateAt = lastPlayerUpdate.get(guildId) || player.__dfordogPlaybackExpectedAt || now;
            const updateAge = now - lastUpdateAt;

            if (now - (lastHeartbeatLog.get(guildId) || 0) >= HEARTBEAT_LOG_MS) {
                const wsState = node?.ws?.readyState;
                const wsPayloadAge = node?.__dfordogLastWsPayloadAt
                    ? Math.round((now - node.__dfordogLastWsPayloadAt) / 1000)
                    : 'n/a';
                console.log(`[ RIFFY WATCH ] guild=${guildId} playing=true playerUpdateAge=${Math.round(updateAge / 1000)}s wsPayloadAge=${wsPayloadAge}s wsState=${wsState ?? 'none'} nodeConnected=${node?.connected === true} reconnectPending=${!!node?.reconnectAttempt} current=${player.current?.info?.title || 'unknown'}`);
                lastHeartbeatLog.set(guildId, now);
            }
        }
    }, WATCHDOG_INTERVAL_MS);

    watchdog.unref?.();

    riffy.__dfordogEventRecoveryInstalled = true;
    riffy.__dfordogEventRecoveryWatchdog = watchdog;
    console.log('[ RIFFY WATCH ] v5 watchdog installed (diagnostics + status reconciliation; no forced reconnect on playerUpdate silence).');
}

/**
 * Compatibility/recovery patch for Riffy 1.0.12.
 *
 * 1) Allow legitimate destroy() after Discord reports channel_id=null.
 * 2) Remove disconnected/zombie guild players before createConnection().
 * 3) Preserve one Riffy instance/listener set across node reconnects.
 * 4) Serialize node reconnects and let Riffy own websocket close/reconnect.
 * 5) Reconcile Discord status from playerUpdate when TrackStartEvent is missed.
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

    console.log('[ RIFFY VOICE ] Lifecycle recovery patch v5 installed (native websocket reconnect + zombie cleanup).');
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

        // Base LavalinkNodeManager used node.connect() directly while Riffy's own
        // reconnectAttempt could already be pending. Node.connect() closes whatever
        // websocket is currently referenced, which can create close/open races and
        // multiple Lavalink sessions. Serialize that path here.
        manager.attemptConnectNode = async function(nodeId) {
            const nodeConfig = this.nodes.get(nodeId);
            if (!nodeConfig || !this.riffy) return false;

            const healthy = await this.checkNodeHealth(nodeId).catch(() => false);
            if (!healthy) return false;

            let node = this._findRiffyNodeObjectByConfig(nodeConfig);

            try {
                if (!node) {
                    console.warn(`[ LAVALINK ][RECOVERY] Runtime node ${nodeConfig.id} is missing; creating one replacement node.`);
                    node = this.riffy.createNode({
                        host: nodeConfig.host,
                        password: nodeConfig.password,
                        port: nodeConfig.port,
                        secure: !!nodeConfig.secure,
                        name: nodeConfig.id,
                        displayName: nodeConfig.displayName || nodeConfig.name || nodeConfig.id
                    });
                    attachNodeSocketActivity(node);
                    return true;
                }

                attachNodeSocketActivity(node);

                const wsState = node.ws?.readyState;
                if (node.connected === true && wsState === WS_OPEN) return true;
                if (wsState === WS_CONNECTING || node.reconnectAttempt) return true;

                return scheduleNativeReconnect(node, 'Lavalink manager detected disconnected node');
            } catch (error) {
                console.warn(`[ LAVALINK ][RECOVERY] Failed reconnecting ${nodeConfig.id}: ${error?.message || error}`);
                return false;
            }
        };

        manager.refreshRiffy = async function() {
            // Never replace a live Riffy EventEmitter. player.js, status handlers and
            // lifecycle guards are registered on this exact instance.
            if (this.riffy) {
                this.client.riffy = this.riffy;
                installRiffyInstanceRecovery(this.riffy);

                if (this.hasConnectedNodes()) return true;

                console.warn('[ LAVALINK ][RECOVERY] Reconnecting nodes on the existing Riffy instance; listeners and players are preserved.');

                const attempts = [];
                for (const nodeId of this.nodes.keys()) {
                    attempts.push(this.attemptConnectNode(nodeId).catch(() => false));
                }
                await Promise.allSettled(attempts);

                const recovered = await this.waitForConnectedNode(8000).catch(() => false);
                this.client.riffy = this.riffy;
                return recovered || this.hasConnectedNodes();
            }

            // Startup-only fallback when there genuinely is no Riffy instance.
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
        console.log('[ LAVALINK ][RECOVERY] v5 serialized reconnect patch installed.');
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
