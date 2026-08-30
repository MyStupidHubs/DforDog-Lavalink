const { ActivityType } = require('discord.js');
const { Riffy, Player } = require('riffy');
const StatusManager = require('./statusManager.js');

const LATE_DISCONNECT_WINDOW_MS = 4000;
const JOIN_BOOTSTRAP_WINDOW_MS = 4000;

function getActualBotVoiceChannelId(client, guildId) {
    return client?.guilds?.cache?.get(guildId)?.members?.me?.voice?.channelId || null;
}

function playerIsActuallyInVoice(client, guildId, player, expectedVoiceChannelId = null) {
    if (!player || !guildId) return false;

    const actualVoiceChannelId = getActualBotVoiceChannelId(client, guildId);
    const targetVoiceChannelId = expectedVoiceChannelId || player.voiceChannel || player.connection?.voiceChannel || null;

    if (!actualVoiceChannelId) return false;
    if (targetVoiceChannelId && actualVoiceChannelId !== targetVoiceChannelId) return false;
    if (player.connected !== true) return false;
    if (!player.connection) return false;

    return true;
}

function retireStalePlayerWithoutGatewayDisconnect(riffy, player, reason) {
    if (!riffy || !player) return;

    const guildId = player.guildId;

    console.warn(`[ RIFFY JOIN ] Retiring stale player for guild ${guildId} without sending Discord channel_id=null; reason=${reason}.`);

    player.__dfordogRetired = true;
    player.playing = false;
    player.paused = false;
    player.connected = false;

    try {
        player.queue?.clear?.();
    } catch (_) {}

    // Delete only the stale Lavalink-side player. Player.destroy() cannot be used
    // here because it also sends a Discord voice-state update with channel_id=null.
    // That delayed gateway acknowledgement can arrive after the replacement player
    // is already mapped and Riffy then destroys the new player by guildId.
    try {
        const result = player.node?.rest?.destroyPlayer?.(guildId);
        if (result && typeof result.catch === 'function') {
            result.catch((error) => {
                console.warn(`[ RIFFY JOIN ] Failed deleting stale Lavalink player for guild ${guildId}: ${error?.message || error}`);
            });
        }
    } catch (error) {
        console.warn(`[ RIFFY JOIN ] Failed deleting stale Lavalink player for guild ${guildId}: ${error?.message || error}`);
    }

    try {
        player.removeAllListeners?.();
    } catch (_) {}

    player.connection = null;
    riffy.players?.delete(guildId);
}

function installPlayerVoiceSemanticsFix() {
    if (!Player?.prototype || Player.prototype.__dfordogConfirmedVoiceSemanticsV11) return;

    const originalConnect = Player.prototype.connect;
    const originalDestroy = Player.prototype.destroy;

    Player.prototype.connect = function(...args) {
        this.__dfordogVoiceJoinStartedAt = Date.now();
        this.__dfordogRetired = false;

        const result = originalConnect.apply(this, args);

        // Riffy 1.0.12 optimistically sets connected=true as soon as it sends the
        // Discord gateway request. Keep it false until Lavalink sends the actual
        // playerUpdate(state.connected=true), which Player's native handler already
        // turns into connected=true. This makes /play's connection wait meaningful.
        this.connected = false;

        return result;
    };

    Player.prototype.destroy = function(...args) {
        const riffy = this.riffy;
        const guildId = this.guildId;

        if (riffy && guildId) {
            if (!riffy.__dfordogVoiceDisconnectRequests) {
                riffy.__dfordogVoiceDisconnectRequests = new Map();
            }

            riffy.__dfordogVoiceDisconnectRequests.set(guildId, {
                at: Date.now(),
                player: this
            });
        }

        return originalDestroy.apply(this, args);
    };

    Object.defineProperty(Player.prototype, '__dfordogConfirmedVoiceSemanticsV11', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
    });
}

function installRiffyJoinRaceFix() {
    if (!Riffy?.prototype || Riffy.prototype.__dfordogVoiceJoinRaceFixV11) return;

    const previousCreateConnection = Riffy.prototype.createConnection;
    const previousUpdateVoiceState = Riffy.prototype.updateVoiceState;

    Riffy.prototype.createConnection = function(options) {
        const guildId = options?.guildId;
        const existingPlayer = guildId ? this.players?.get(guildId) : null;

        if (existingPlayer) {
            const actualBotVoiceChannelId = getActualBotVoiceChannelId(this.client, guildId);
            const joinAge = existingPlayer.__dfordogVoiceJoinStartedAt
                ? Date.now() - existingPlayer.__dfordogVoiceJoinStartedAt
                : Infinity;
            const connection = existingPlayer.connection;
            const connectionWorkInProgress = !!connection && (
                connection.establishing === true ||
                !!connection.pendingUpdate ||
                !!connection.deferred
            );
            const joiningNow = existingPlayer.connected !== true &&
                !!connection &&
                (connectionWorkInProgress || joinAge <= JOIN_BOOTSTRAP_WINDOW_MS);
            const trulyStale = existingPlayer.__dfordogRetired === true ||
                !connection ||
                (existingPlayer.connected !== true && !actualBotVoiceChannelId && !joiningNow);

            if (trulyStale) {
                retireStalePlayerWithoutGatewayDisconnect(
                    this,
                    existingPlayer,
                    !connection
                        ? 'missing connection object'
                        : 'not connected in Discord or Lavalink'
                );
            } else {
                // Bypass the older v5 wrapper for a healthy/in-progress player. Its
                // connected=false heuristic is too broad now that v11 intentionally
                // keeps connected=false until real Lavalink confirmation.
                return existingPlayer;
            }
        }

        const player = previousCreateConnection.call(this, options);
        if (player) {
            player.__dfordogVoiceJoinStartedAt = player.__dfordogVoiceJoinStartedAt || Date.now();
        }
        return player;
    };

    Riffy.prototype.updateVoiceState = async function(packet) {
        const isBotVoiceState = packet?.t === 'VOICE_STATE_UPDATE' &&
            packet?.d?.user_id === this.clientId;

        if (isBotVoiceState) {
            const guildId = packet.d.guild_id;
            const currentPlayer = this.players?.get(guildId);
            const disconnectMarker = this.__dfordogVoiceDisconnectRequests?.get(guildId);

            if (packet.d.channel_id == null && currentPlayer && disconnectMarker) {
                const markerAge = Date.now() - disconnectMarker.at;
                const replacementStartedAfterDisconnect =
                    currentPlayer !== disconnectMarker.player &&
                    (currentPlayer.__dfordogVoiceJoinStartedAt || 0) >= disconnectMarker.at;

                if (markerAge <= LATE_DISCONNECT_WINDOW_MS && replacementStartedAfterDisconnect) {
                    this.__dfordogVoiceDisconnectRequests.delete(guildId);
                    console.warn(`[ RIFFY JOIN ] Ignored delayed channel_id=null for old player in guild ${guildId}; replacement join is already in progress.`);
                    return;
                }
            }

            if (packet.d.channel_id != null && currentPlayer) {
                const target = currentPlayer.voiceChannel || currentPlayer.connection?.voiceChannel || null;
                if (!target || packet.d.channel_id === target) {
                    this.__dfordogVoiceDisconnectRequests?.delete(guildId);
                }
            }
        }

        return previousUpdateVoiceState.call(this, packet);
    };

    Object.defineProperty(Riffy.prototype, '__dfordogVoiceJoinRaceFixV11', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
    });
}

function installStatusVoiceTruthFix() {
    const proto = StatusManager?.prototype;
    if (!proto || proto.__dfordogVoiceTruthStatusV11) return;

    const originalGetPlayerInfo = proto.getPlayerInfo;
    const originalUpdateStatusAndVoice = proto.updateStatusAndVoice;
    const originalSetVoiceChannelStatus = proto.setVoiceChannelStatus;
    const originalOnTrackStart = proto.onTrackStart;
    const originalOnPlayerDisconnect = proto.onPlayerDisconnect;

    proto.getPlayerInfo = function(guildId) {
        const player = this.client.riffy?.players?.get(guildId);
        if (!playerIsActuallyInVoice(this.client, guildId, player)) {
            return null;
        }
        return originalGetPlayerInfo.call(this, guildId);
    };

    proto.updateStatusAndVoice = async function(guildId) {
        this.__dfordogPresenceGuildId = guildId;
        return originalUpdateStatusAndVoice.call(this, guildId);
    };

    // Replace the repeating presence interval with one that verifies the bot is
    // still physically in the voice channel before re-applying the track title.
    proto.setPlayingStatus = async function(trackTitle) {
        this.stopCurrentStatus();
        this.isPlaying = true;

        const guildId = this.__dfordogPresenceGuildId || null;
        const activity = `🎵 ${trackTitle}`;

        await this.client.user.setPresence({
            activities: [{ name: activity, type: ActivityType.Listening }],
            status: 'online'
        });

        this.currentInterval = setInterval(async () => {
            try {
                if (!this.isPlaying) return;

                if (guildId) {
                    const info = this.getPlayerInfo(guildId);
                    if (!info?.playing || !info.title) {
                        console.warn(`[ STATUS GUARD ] Voice truth check failed for guild ${guildId}; clearing stale music presence.`);
                        await this.setDefaultStatus();
                        await this.clearVoiceChannelStatus(guildId).catch(() => {});
                        return;
                    }
                }

                await this.client.user.setPresence({
                    activities: [{ name: activity, type: ActivityType.Listening }],
                    status: 'online'
                });
            } catch (error) {
                console.warn(`[ STATUS GUARD ] Presence verification failed: ${error?.message || error}`);
            }
        }, 30000);

        this.currentInterval.unref?.();
    };

    proto.setVoiceChannelStatus = async function(guildId, trackTitle, voiceChannelId = null) {
        const player = this.client.riffy?.players?.get(guildId);
        const targetVoiceChannelId = voiceChannelId || player?.voiceChannel || null;
        const actualVoiceChannelId = getActualBotVoiceChannelId(this.client, guildId);

        if (!targetVoiceChannelId || !actualVoiceChannelId || targetVoiceChannelId !== actualVoiceChannelId) {
            console.warn(`[ STATUS GUARD ] Refusing voice-channel status for guild ${guildId}; bot is not in the target voice channel.`);
            return;
        }

        return originalSetVoiceChannelStatus.call(this, guildId, trackTitle, targetVoiceChannelId);
    };

    proto.onTrackStart = async function(guildId, trackTitle, voiceChannelId = null) {
        const player = this.client.riffy?.players?.get(guildId);
        const targetVoiceChannelId = voiceChannelId || player?.voiceChannel || null;

        if (!playerIsActuallyInVoice(this.client, guildId, player, targetVoiceChannelId)) {
            console.warn(`[ STATUS GUARD ] Ignoring trackStart status for guild ${guildId}; no confirmed bot voice connection exists.`);
            this.__dfordogPresenceGuildId = null;
            await this.setDefaultStatus().catch(() => {});
            await this.clearVoiceChannelStatus(guildId).catch(() => {});
            return;
        }

        this.__dfordogPresenceGuildId = guildId;
        return originalOnTrackStart.call(this, guildId, trackTitle, targetVoiceChannelId);
    };

    proto.onPlayerDisconnect = async function(guildId = null) {
        if (!guildId || this.__dfordogPresenceGuildId === guildId) {
            this.__dfordogPresenceGuildId = null;
        }
        return originalOnPlayerDisconnect.call(this, guildId);
    };

    Object.defineProperty(proto, '__dfordogVoiceTruthStatusV11', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
    });
}

installPlayerVoiceSemanticsFix();
installRiffyJoinRaceFix();
installStatusVoiceTruthFix();

console.log('[ RIFFY JOIN ] v11 confirmed-voice join race fix installed.');
console.log('[ STATUS GUARD ] v11 voice-truth status guard installed.');

module.exports = {
    installRiffyJoinRaceFix,
    installStatusVoiceTruthFix
};
