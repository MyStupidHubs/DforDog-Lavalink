const { ActivityType } = require('discord.js');
const { Riffy, Player } = require('riffy');
const StatusManager = require('./statusManager.js');

const LATE_DISCONNECT_WINDOW_MS = 4000;
const JOIN_BOOTSTRAP_WINDOW_MS = 4000;
const UNEXPECTED_REJOIN_DELAY_MS = 250;
const UNEXPECTED_REJOIN_COOLDOWN_MS = 60000;

function getActualBotVoiceChannelId(client, guildId) {
    const guild = client?.guilds?.cache?.get(guildId);
    // Discord's gateway voice state is authoritative; Player.voiceChannel
    // only records where Riffy last tried to connect.
    const state = guild?.voiceStates?.cache?.get(client?.user?.id || client?.userId);
    if (state && 'channelId' in state) return state.channelId || null;
    return guild?.members?.me?.voice?.channelId || null;
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
    if (!riffy || !player) return Promise.resolve(false);

    const guildId = player.guildId;
    if (riffy.players?.get(guildId) !== player) return Promise.resolve(false);

    console.warn(`[ RIFFY JOIN ] Retiring stale player for guild ${guildId} WITHOUT Discord voice leave; reason=${reason}.`);

    // Mark it dead before clearing timers: the delayed handshake and Riffy
    // callbacks must never rejoin/disconnect a replacement player.
    player.__dfordogRetired = true;
    player.__dfordogHandshakeDead = true;
    player.__dfordogHandshakeRecovery = null;
    for (const key of [
        '__dfordogHandshakeInitialTimer',
        '__dfordogHandshakeLeaveAckTimer',
        '__dfordogHandshakeFinalTimer',
        '__dfordogRestStartFallbackTimer',
        '__dfordogPanelTrackStartTimer'
    ]) {
        if (player[key]) clearTimeout(player[key]);
        player[key] = null;
    }

    player.playing = false;
    player.paused = false;
    player.connected = false;

    try { player.queue?.clear?.(); } catch (_) {}

    // Do NOT call Player.destroy(): it sends Discord channel_id=null, and a
    // late acknowledgment can kick the replacement connection. Await the
    // Lavalink REST delete before creating the replacement player, otherwise
    // a late DELETE could wipe the new player from the same guild.
    let removal;
    try {
        removal = Promise.resolve(player.node?.rest?.destroyPlayer?.(guildId))
            .then(() => true, (error) => {
                console.warn(`[ RIFFY JOIN ] Lavalink stale-player delete failed guild=${guildId}: ${error?.message || error}`);
                return false;
            });
    } catch (error) {
        console.warn(`[ RIFFY JOIN ] Lavalink stale-player delete threw guild=${guildId}: ${error?.message || error}`);
        removal = Promise.resolve(false);
    }

    try { player.removeAllListeners?.(); } catch (_) {}
    player.connection = null;
    if (riffy.players?.get(guildId) === player) {
        riffy.players.delete(guildId);
    }

    return removal;
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

            // Riffy 1.0.12 destroys the player immediately for every bot
            // channel_id=null event. On a spontaneous Discord voice drop that
            // also destroys the queue and sends DELETE to Lavalink. Preserve
            // active playback and ask Discord to join again instead.
            if (packet.d.channel_id == null && currentPlayer) {
                const now = Date.now();
                const requestedLeave = disconnectMarker?.player === currentPlayer &&
                    now - disconnectMarker.at <= 15000;
                const target = currentPlayer.voiceChannel || currentPlayer.connection?.voiceChannel;
                const lastRejoinAt = currentPlayer.__dfordogUnexpectedRejoinAt || 0;
                const retryAllowed = !lastRejoinAt ||
                    now - lastRejoinAt >= UNEXPECTED_REJOIN_COOLDOWN_MS;
                const activeTrack = (currentPlayer.playing === true ||
                    currentPlayer.paused === true) &&
                    !!currentPlayer.current && !!currentPlayer.connection;

                if (!requestedLeave && retryAllowed && activeTrack && target &&
                    currentPlayer.__dfordogRetired !== true &&
                    currentPlayer.__dfordogHandshakeDead !== true &&
                    !currentPlayer.__dfordogHandshakeRecovery) {
                    currentPlayer.__dfordogUnexpectedRejoinAt = now;
                    currentPlayer.connected = false;
                    const wasPaused = currentPlayer.paused === true;
                    console.warn(`[ RIFFY VOICE ] Unexpected Discord voice leave in guild ${guildId}; playing=${currentPlayer.playing === true} paused=${wasPaused}, rejoining ${target} without destroying the Lavalink player.`);

                    const timer = setTimeout(() => {
                        if (this.players?.get(guildId) !== currentPlayer ||
                            currentPlayer.__dfordogRetired === true ||
                            currentPlayer.__dfordogHandshakeDead === true) return;

                        try {
                            // Riffy unpauses on VOICE_SERVER_UPDATE after a rejoin.
                            // Restore the original user's paused state as soon as
                            // the Lavalink connection confirms it is alive again.
                            if (wasPaused) {
                                currentPlayer.once('connectionRestored', () => {
                                    if (this.players?.get(guildId) !== currentPlayer) return;
                                    Promise.resolve(currentPlayer.pause(true)).catch((error) => {
                                        console.warn(`[ RIFFY VOICE ] Could not restore paused track in guild ${guildId}: ${error?.message || error}`);
                                    });
                                });
                            }

                            currentPlayer.connect({
                                guildId,
                                voiceChannel: target,
                                textChannel: currentPlayer.textChannel,
                                deaf: currentPlayer.deaf ?? true,
                                mute: currentPlayer.mute ?? false
                            });
                        } catch (error) {
                            console.warn(`[ RIFFY VOICE ] Unexpected voice rejoin failed for guild ${guildId}: ${error?.message || error}`);
                        }
                    }, UNEXPECTED_REJOIN_DELAY_MS);
                    timer.unref?.();
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
    installStatusVoiceTruthFix,
    retireStalePlayerWithoutGatewayDisconnect,
    getActualBotVoiceChannelId
};
