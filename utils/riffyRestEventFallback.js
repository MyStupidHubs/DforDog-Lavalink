const { Riffy } = require('riffy');

const TRACK_START_FALLBACK_MS = 1500;
const REST_RECONCILE_INTERVAL_MS = 5000;
const REMOTE_EMPTY_CONFIRM_MS = 7000;
const PLAYER_UPDATE_FALLBACK_AFTER_MS = 10000;

function getTrackKey(track) {
    return track?.info?.identifier || track?.info?.uri || track?.track || null;
}

function getRemoteTrackEncoded(remotePlayer) {
    return remotePlayer?.track?.encoded || remotePlayer?.track?.track || null;
}

function clearStartFallback(player) {
    if (!player?.__dfordogRestStartFallbackTimer) return;
    clearTimeout(player.__dfordogRestStartFallbackTimer);
    player.__dfordogRestStartFallbackTimer = null;
}

async function confirmRemoteTrack(player, expectedEncoded) {
    const rest = player?.node?.rest;
    if (!rest || typeof rest.getPlayers !== 'function') return false;

    try {
        const players = await rest.getPlayers();
        if (!Array.isArray(players)) return false;

        const remote = players.find((item) => String(item?.guildId) === String(player.guildId));
        if (!remote) return false;

        const remoteEncoded = getRemoteTrackEncoded(remote);
        if (!remoteEncoded) return false;
        if (expectedEncoded && remoteEncoded !== expectedEncoded) return false;

        return true;
    } catch (error) {
        console.warn(`[ RIFFY REST ] Unable to confirm remote track for guild ${player?.guildId || 'unknown'}: ${error?.message || error}`);
        return false;
    }
}

function patchPlayerPlay(player) {
    if (!player || player.__dfordogRestEventPlayPatchInstalled || typeof player.play !== 'function') return;

    const originalPlay = player.play.bind(player);

    player.play = async function(...args) {
        const result = await originalPlay(...args);

        const attemptId = (this.__dfordogRestPlaybackAttempt || 0) + 1;
        this.__dfordogRestPlaybackAttempt = attemptId;
        this.__dfordogRestExpectedTrackKey = getTrackKey(this.current);
        this.__dfordogRestExpectedTrackEncoded = this.current?.track || null;
        this.__dfordogRestRemoteEmptySince = null;
        this.__dfordogRestRecoveredEndAttempt = null;

        clearStartFallback(this);

        const expectedKey = this.__dfordogRestExpectedTrackKey;
        const expectedEncoded = this.__dfordogRestExpectedTrackEncoded;

        const timer = setTimeout(async () => {
            this.__dfordogRestStartFallbackTimer = null;

            const mappedPlayer = this.riffy?.players?.get(this.guildId);
            if (mappedPlayer !== this || this.playing !== true || !this.current) return;
            if (this.__dfordogRestTrackStartAttempt === attemptId) return;
            if (expectedKey && getTrackKey(this.current) !== expectedKey) return;

            const confirmed = await confirmRemoteTrack(this, expectedEncoded);
            if (!confirmed) return;

            if (this.__dfordogRestTrackStartAttempt === attemptId) return;

            console.warn(`[ RIFFY REST ] Missing TrackStartEvent confirmed for guild ${this.guildId}; synthesizing trackStart for ${this.current?.info?.title || 'unknown track'}.`);
            this.riffy.emit('trackStart', this, this.current, {
                op: 'event',
                type: 'TrackStartEvent',
                guildId: this.guildId,
                __dfordogRestSynthetic: true
            });
        }, TRACK_START_FALLBACK_MS);

        timer.unref?.();
        this.__dfordogRestStartFallbackTimer = timer;

        return result;
    };

    player.__dfordogRestEventPlayPatchInstalled = true;
}

function installRiffyRestEventFallback(riffy) {
    if (!riffy || riffy.__dfordogRestEventFallbackInstalled) return;

    const previousEmit = riffy.emit;

    // This wrapper sits outside the existing lifecycle guard. It only deduplicates
    // a native TrackStartEvent that arrives after the REST-confirmed synthetic one.
    riffy.emit = function(eventName, ...args) {
        if (eventName === 'trackStart') {
            const player = args[0];
            const attemptId = player?.__dfordogRestPlaybackAttempt || 0;

            if (player && attemptId > 0) {
                if (player.__dfordogRestTrackStartAttempt === attemptId) {
                    console.warn(`[ RIFFY REST ] Ignoring duplicate trackStart for guild ${player.guildId}; playback attempt ${attemptId} was already dispatched.`);
                    return true;
                }

                player.__dfordogRestTrackStartAttempt = attemptId;
                player.__dfordogRestRemoteEmptySince = null;
                clearStartFallback(player);
            }
        }

        return previousEmit.call(this, eventName, ...args);
    };

    const patchPlayer = (player) => patchPlayerPlay(player);

    if (riffy.players?.values) {
        for (const player of riffy.players.values()) patchPlayer(player);
    }

    riffy.on('playerCreate', patchPlayer);
    riffy.on('trackStart', (player) => {
        if (!player) return;
        player.__dfordogRestLastPlayerUpdateAt = Date.now();
        player.__dfordogRestRemoteEmptySince = null;
    });
    riffy.on('playerUpdate', (player) => {
        if (!player) return;
        player.__dfordogRestLastPlayerUpdateAt = Date.now();
        player.__dfordogRestRemoteEmptySince = null;
    });
    riffy.on('playerDisconnect', (player) => {
        clearStartFallback(player);
        if (player) {
            player.__dfordogRestRemoteEmptySince = null;
        }
    });

    let reconcileRunning = false;
    let lastRestErrorAt = 0;

    const interval = setInterval(async () => {
        if (reconcileRunning) return;
        reconcileRunning = true;

        try {
            const players = [...(riffy.players?.values?.() || [])];
            if (!players.length) return;

            const playersByNode = new Map();
            for (const player of players) {
                patchPlayer(player);
                if (!player?.node?.rest || typeof player.node.rest.getPlayers !== 'function') continue;
                if (!playersByNode.has(player.node)) playersByNode.set(player.node, []);
                playersByNode.get(player.node).push(player);
            }

            for (const [node, nodePlayers] of playersByNode) {
                let remotePlayers;
                try {
                    remotePlayers = await node.rest.getPlayers();
                } catch (error) {
                    const now = Date.now();
                    if (now - lastRestErrorAt > 30000) {
                        console.warn(`[ RIFFY REST ] Player reconciliation failed on ${node.name || node.host}: ${error?.message || error}`);
                        lastRestErrorAt = now;
                    }
                    continue;
                }

                if (!Array.isArray(remotePlayers)) continue;
                const remoteByGuild = new Map(remotePlayers.map((item) => [String(item?.guildId), item]));
                const now = Date.now();

                for (const player of nodePlayers) {
                    const guildId = String(player.guildId);
                    const remote = remoteByGuild.get(guildId);
                    const remoteEncoded = getRemoteTrackEncoded(remote);
                    const localEncoded = player.current?.track || null;
                    const attemptId = player.__dfordogRestPlaybackAttempt || 0;

                    if (remote?.state && player.playing === true) {
                        const lastPlayerUpdateAt = player.__dfordogRestLastPlayerUpdateAt || 0;
                        if (now - lastPlayerUpdateAt >= PLAYER_UPDATE_FALLBACK_AFTER_MS) {
                            player.emit('playerUpdate', {
                                op: 'playerUpdate',
                                guildId: player.guildId,
                                state: remote.state
                            });
                            console.warn(`[ RIFFY REST ] Recovered missing playerUpdate for guild ${player.guildId} from Lavalink REST state.`);
                        }
                    }

                    if (player.playing !== true || !player.current) {
                        player.__dfordogRestRemoteEmptySince = null;
                        continue;
                    }

                    if (remoteEncoded) {
                        player.__dfordogRestRemoteEmptySince = null;

                        if ((!localEncoded || remoteEncoded === localEncoded) &&
                            attemptId > 0 &&
                            player.__dfordogRestTrackStartAttempt !== attemptId) {
                            console.warn(`[ RIFFY REST ] REST reconciliation found active playback without TrackStartEvent for guild ${player.guildId}; synthesizing trackStart.`);
                            riffy.emit('trackStart', player, player.current, {
                                op: 'event',
                                type: 'TrackStartEvent',
                                guildId: player.guildId,
                                __dfordogRestSynthetic: true
                            });
                        }
                        continue;
                    }

                    if (!player.__dfordogRestRemoteEmptySince) {
                        player.__dfordogRestRemoteEmptySince = now;
                        continue;
                    }

                    if (now - player.__dfordogRestRemoteEmptySince < REMOTE_EMPTY_CONFIRM_MS) continue;
                    if (player.__dfordogRestRecoveredEndAttempt === attemptId) continue;

                    player.__dfordogRestRecoveredEndAttempt = attemptId;
                    player.__dfordogRestRemoteEmptySince = null;

                    console.warn(`[ RIFFY REST ] Lavalink reports no active track for guild ${player.guildId} while Riffy still thinks it is playing; synthesizing TrackEndEvent.`);

                    if (typeof player.handleEvent === 'function') {
                        await player.handleEvent({
                            op: 'event',
                            type: 'TrackEndEvent',
                            guildId: player.guildId,
                            reason: 'finished',
                            __dfordogRestSynthetic: true
                        });
                    }
                }
            }
        } finally {
            reconcileRunning = false;
        }
    }, REST_RECONCILE_INTERVAL_MS);

    interval.unref?.();

    riffy.__dfordogRestEventFallbackInstalled = true;
    riffy.__dfordogRestEventFallbackInterval = interval;
    console.log('[ RIFFY REST ] v6 event fallback installed (REST-confirmed trackStart/playerUpdate/trackEnd recovery).');
}

function installPrototypePatch() {
    if (!Riffy?.prototype || Riffy.prototype.__dfordogRestEventFallbackPrototypeInstalled) return;

    const previousInit = Riffy.prototype.init;
    const previousCreateConnection = Riffy.prototype.createConnection;

    Riffy.prototype.init = function(...args) {
        const result = previousInit.apply(this, args);
        installRiffyRestEventFallback(this);
        return result;
    };

    Riffy.prototype.createConnection = function(options) {
        const player = previousCreateConnection.call(this, options);
        patchPlayerPlay(player);
        return player;
    };

    Object.defineProperty(Riffy.prototype, '__dfordogRestEventFallbackPrototypeInstalled', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
    });

    console.log('[ RIFFY REST ] v6 prototype fallback patch loaded.');
}

installPrototypePatch();

module.exports = {
    installRiffyRestEventFallback
};
