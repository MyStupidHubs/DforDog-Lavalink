const { Riffy } = require('riffy');

const START_CONFIRM_DELAY_MS = 1800;
const LATE_NATIVE_DUPLICATE_WINDOW_MS = 6000;

function getTrackKey(track) {
    return track?.info?.identifier || track?.info?.uri || track?.track || track?.encoded || null;
}

function getTrackEncoded(track) {
    return track?.track || track?.encoded || null;
}

function getRemoteEncoded(remotePlayer) {
    return remotePlayer?.track?.encoded || remotePlayer?.track?.track || null;
}

function clearRecoveryTimer(player) {
    if (!player?.__dfordogPanelTrackStartTimer) return;
    clearTimeout(player.__dfordogPanelTrackStartTimer);
    player.__dfordogPanelTrackStartTimer = null;
}

function installTrackStartPanelRecovery(riffy) {
    if (!riffy || riffy.__dfordogTrackStartPanelRecoveryInstalled) return;

    const observedTracks = new Map();
    const previousEmit = riffy.emit;

    // Installed after the bot lifecycle guard. Suppress only a native TrackStartEvent
    // that arrives shortly after this recovery already dispatched the same track.
    riffy.emit = function(eventName, ...args) {
        if (eventName === 'trackStart') {
            const player = args[0];
            const track = args[1] || player?.current;
            const payload = args[2];
            const key = getTrackKey(track);
            const marker = player?.__dfordogPanelSyntheticTrackStart;
            const isOurSynthetic = payload?.__dfordogPanelRecoverySynthetic === true;

            if (!isOurSynthetic && marker && key && marker.key === key &&
                Date.now() - marker.at < LATE_NATIVE_DUPLICATE_WINDOW_MS) {
                console.warn(`[ RIFFY PANEL ] Ignoring late duplicate native trackStart for guild ${player.guildId}; panel recovery already dispatched ${track?.info?.title || 'the track'}.`);
                return true;
            }
        }

        return previousEmit.call(this, eventName, ...args);
    };

    const synthesizeTrackStart = (player, source) => {
        if (!player?.guildId || player.playing !== true || !player.current?.info) return false;

        const guildId = player.guildId;
        const track = player.current;
        const key = getTrackKey(track);
        if (!key || observedTracks.get(guildId) === key) return false;

        // riffyRestEventFallback has an attempt-level dedupe marker. If it claims a
        // trackStart was already dispatched while this independent observer proves it
        // never reached listeners, clear only that stale marker before re-emitting.
        const attemptId = player.__dfordogRestPlaybackAttempt || 0;
        if (attemptId > 0 && player.__dfordogRestTrackStartAttempt === attemptId) {
            player.__dfordogRestTrackStartAttempt = null;
        }

        observedTracks.set(guildId, key);
        player.__dfordogPanelSyntheticTrackStart = { key, at: Date.now(), source };
        clearRecoveryTimer(player);

        console.warn(`[ RIFFY PANEL ] Missing trackStart recovered for guild ${guildId} from ${source}; dispatching full trackStart for ${track.info.title || 'unknown track'}.`);

        riffy.emit('trackStart', player, track, {
            op: 'event',
            type: 'TrackStartEvent',
            guildId,
            __dfordogPanelRecoverySynthetic: true,
            __dfordogRecoverySource: source
        });

        return true;
    };

    const patchPlayerPlay = (player) => {
        if (!player || player.__dfordogPanelTrackStartPlayPatchInstalled || typeof player.play !== 'function') return;

        const originalPlay = player.play.bind(player);

        player.play = async function(...args) {
            const result = await originalPlay(...args);
            const expectedKey = getTrackKey(this.current);
            const expectedEncoded = getTrackEncoded(this.current);
            const sequence = (this.__dfordogPanelPlaybackSequence || 0) + 1;
            this.__dfordogPanelPlaybackSequence = sequence;

            clearRecoveryTimer(this);

            const timer = setTimeout(async () => {
                this.__dfordogPanelTrackStartTimer = null;

                const mappedPlayer = riffy.players?.get(this.guildId);
                if (mappedPlayer !== this || this.playing !== true || !this.current?.info) return;
                if (this.__dfordogPanelPlaybackSequence !== sequence) return;
                if (expectedKey && getTrackKey(this.current) !== expectedKey) return;
                if (observedTracks.get(this.guildId) === getTrackKey(this.current)) return;

                const rest = this.node?.rest;
                if (!rest || typeof rest.getPlayers !== 'function') return;

                try {
                    const remotePlayers = await rest.getPlayers();
                    if (!Array.isArray(remotePlayers)) return;

                    const remote = remotePlayers.find((item) => String(item?.guildId) === String(this.guildId));
                    const remoteEncoded = getRemoteEncoded(remote);
                    if (!remoteEncoded) return;

                    const currentEncoded = getTrackEncoded(this.current);
                    const comparableEncoded = currentEncoded || expectedEncoded;
                    if (comparableEncoded && remoteEncoded !== comparableEncoded) return;

                    synthesizeTrackStart(this, 'Lavalink REST confirmation');
                } catch (error) {
                    console.warn(`[ RIFFY PANEL ] REST trackStart confirmation failed for guild ${this.guildId}: ${error?.message || error}`);
                }
            }, START_CONFIRM_DELAY_MS);

            timer.unref?.();
            this.__dfordogPanelTrackStartTimer = timer;
            return result;
        };

        player.__dfordogPanelTrackStartPlayPatchInstalled = true;
    };

    riffy.__dfordogTrackStartPanelRecoveryPatchPlayer = patchPlayerPlay;

    if (riffy.players?.values) {
        for (const player of riffy.players.values()) patchPlayerPlay(player);
    }

    riffy.on('playerCreate', patchPlayerPlay);

    riffy.on('trackStart', (player, track) => {
        if (!player?.guildId) return;
        const key = getTrackKey(track || player.current);
        if (key) observedTracks.set(player.guildId, key);
        clearRecoveryTimer(player);
    });

    // Render proved that playerUpdate survives when TrackStartEvent does not. Promote
    // that surviving signal to a complete trackStart so player.js also creates the
    // now-playing panel instead of recovering only Discord presence/status.
    riffy.on('playerUpdate', (player, packet) => {
        if (!player?.guildId || player.playing !== true || !player.current?.info) return;
        if (packet?.state?.connected === false) return;

        const key = getTrackKey(player.current);
        if (!key || observedTracks.get(player.guildId) === key) return;
        synthesizeTrackStart(player, 'playerUpdate');
    });

    const clearObserved = (player) => {
        if (!player?.guildId) return;
        observedTracks.delete(player.guildId);
        clearRecoveryTimer(player);
    };

    riffy.on('trackEnd', clearObserved);
    riffy.on('queueEnd', clearObserved);
    riffy.on('playerDisconnect', clearObserved);

    riffy.__dfordogTrackStartPanelRecoveryInstalled = true;
    riffy.__dfordogTrackStartPanelRecoveryObserved = observedTracks;
    console.log('[ RIFFY PANEL ] v8 full trackStart/panel recovery installed (REST + playerUpdate).');
}

function installPrototypePatch() {
    if (!Riffy?.prototype || Riffy.prototype.__dfordogTrackStartPanelRecoveryPrototypeInstalled) return;

    const previousInit = Riffy.prototype.init;
    const previousCreateConnection = Riffy.prototype.createConnection;

    Riffy.prototype.init = function(...args) {
        const result = previousInit.apply(this, args);
        installTrackStartPanelRecovery(this);
        return result;
    };

    Riffy.prototype.createConnection = function(options) {
        const player = previousCreateConnection.call(this, options);
        this.__dfordogTrackStartPanelRecoveryPatchPlayer?.(player);
        return player;
    };

    Object.defineProperty(Riffy.prototype, '__dfordogTrackStartPanelRecoveryPrototypeInstalled', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
    });

    console.log('[ RIFFY PANEL ] v8 prototype recovery patch loaded.');
}

installPrototypePatch();

module.exports = {
    installTrackStartPanelRecovery
};
