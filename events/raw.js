const { GatewayDispatchEvents } = require('discord.js');

/**
 * Riffy 1.0.12 destroys a player when Discord reports the bot's own
 * VOICE_STATE_UPDATE with channel_id=null.
 *
 * The lifecycle guard in bot.js may intentionally block a destroy while
 * player.playing is still true. That is useful for stale application cleanup,
 * but a real Discord voice disconnect must never leave the mapped player alive.
 *
 * This event listener runs after the main raw handler. If the normal Riffy
 * cleanup was blocked and the player is still mapped, force the same cleanup
 * with the local playing flag cleared so the destroy guard allows it.
 */
module.exports = async (client, packet) => {
    if (packet?.t !== GatewayDispatchEvents.VoiceStateUpdate) return;
    if (packet.d?.user_id !== client.user?.id) return;
    if (packet.d?.channel_id !== null) return;

    const guildId = packet.d?.guild_id;
    if (!guildId) return;

    const player = client.riffy?.players?.get(guildId);
    if (!player) return;

    console.warn(
        `[ RIFFY VOICE ] Discord confirmed bot disconnected from voice in guild ${guildId}; ` +
        'forcing cleanup of the remaining Riffy player.'
    );

    // This is not a speculative/stale application cleanup: Discord has already
    // confirmed that the bot is no longer in a voice channel. Clear only local
    // playback flags so the v3 destroy guard cannot leave a zombie player.
    player.playing = false;
    player.paused = false;

    try {
        player.destroy();
    } catch (error) {
        console.error(`[ RIFFY VOICE ] Failed to destroy disconnected player for guild ${guildId}:`, error);

        // Last-resort map cleanup so createConnection() cannot keep returning a
        // disconnected player forever on the next /play.
        try {
            if (client.riffy?.players?.get(guildId) === player) {
                client.riffy.players.delete(guildId);
            }
        } catch (_) {}

        if (client.statusManager) {
            await client.statusManager.onPlayerDisconnect(guildId).catch(() => {});
        }
    }
};
