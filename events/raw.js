const { GatewayDispatchEvents } = require('discord.js');

const FALLBACK_CLEANUP_DELAY_MS = 900;
const LATE_DISCONNECT_WINDOW_MS = 4000;
const HANDSHAKE_WINDOW_MS = 8000;

/**
 * The main bot.js raw listener delegates voice events to Riffy. This listener
 * is ONLY a safety net if Riffy leaves a disconnected player mapped.
 *
 * Never immediately destroy on channel_id=null: v11/v12 deliberately ignore
 * delayed old-player acknowledgements and temporary leave/rejoin packets.
 * The previous unconditional destroy undid those protections and could DELETE
 * a healthy replacement player while it was playing music.
 */
module.exports = (client, packet) => {
    if (packet?.t !== GatewayDispatchEvents.VoiceStateUpdate) return;
    if (packet.d?.user_id !== client.user?.id || packet.d?.channel_id != null) return;

    const guildId = packet.d?.guild_id;
    if (!guildId) return;

    const riffy = client.riffy;
    const player = riffy?.players?.get(guildId);
    if (!player) return;

    const isRecovering = () => {
        const marker = player.__dfordogHandshakeRecovery;
        return !!marker &&
            Date.now() - marker.startedAt <= HANDSHAKE_WINDOW_MS &&
            (marker.phase === 'leaving' || marker.phase === 'rejoining');
    };

    const isOldDisconnectAcknowledgement = () => {
        const marker = riffy.__dfordogVoiceDisconnectRequests?.get(guildId);
        return !!marker &&
            marker.player !== player &&
            Date.now() - marker.at <= LATE_DISCONNECT_WINDOW_MS &&
            (player.__dfordogVoiceJoinStartedAt || 0) >= marker.at;
    };

    if (isRecovering() || isOldDisconnectAcknowledgement()) {
        console.warn(`[ RIFFY VOICE ] Ignoring expected recovery/stale voice-leave acknowledgement for guild ${guildId}.`);
        return;
    }

    // Native Riffy cleanup happens asynchronously. Give it time to finish,
    // then verify BOTH player identity and Discord's latest voice state.
    const timer = setTimeout(() => {
        if (riffy.players?.get(guildId) !== player) return;
        if (!player.connection) {
            // Native cleanup already discarded the connection but left a map
            // entry. Only retire that exact obsolete entry; never send DELETE
            // for a replacement player sharing this guild ID.
            riffy.players.delete(guildId);
            return;
        }
        if (isRecovering() || isOldDisconnectAcknowledgement()) return;

        const actualVoiceChannelId = client.guilds?.cache?.get(guildId)
            ?.members?.me?.voice?.channelId || null;
        if (actualVoiceChannelId) {
            console.warn(`[ RIFFY VOICE ] Ignoring outdated channel_id=null for guild ${guildId}; bot remains in voice channel ${actualVoiceChannelId}.`);
            return;
        }

        console.warn(`[ RIFFY VOICE ] Confirmed disconnect left a stale Riffy player in guild ${guildId}; performing fallback cleanup.`);
        player.playing = false;
        player.paused = false;

        try {
            player.destroy();
        } catch (error) {
            console.error(`[ RIFFY VOICE ] Fallback cleanup failed for guild ${guildId}:`, error);
            if (riffy.players?.get(guildId) === player) riffy.players.delete(guildId);
        }
    }, FALLBACK_CLEANUP_DELAY_MS);

    timer.unref?.();
};
