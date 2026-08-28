const { Riffy } = require('riffy');

/**
 * Compatibility/recovery patch for Riffy 1.0.12.
 *
 * The bot's lifecycle guard intentionally blocks stale async destroy() calls while
 * a newer track is already playing. Riffy itself, however, also calls destroy()
 * from Connection.setStateUpdate() when Discord sends a VOICE_STATE_UPDATE with
 * channel_id=null. That destroy is legitimate and must never be blocked.
 *
 * This preload patch runs before bot.js so the distinction is made at the source.
 */
function installRiffyVoiceLifecycleFix() {
    if (!Riffy?.prototype || Riffy.prototype.__dfordogVoiceLifecycleFixInstalled) return;

    const originalUpdateVoiceState = Riffy.prototype.updateVoiceState;
    const originalCreateConnection = Riffy.prototype.createConnection;

    Riffy.prototype.updateVoiceState = async function(packet) {
        const isBotVoiceDisconnect = packet?.t === 'VOICE_STATE_UPDATE' &&
            packet?.d?.user_id === this.clientId &&
            packet?.d?.channel_id == null;

        if (isBotVoiceDisconnect) {
            const guildId = packet.d.guild_id;
            const player = this.players?.get(guildId);

            if (player) {
                // Discord has authoritatively told us that the bot is no longer in
                // voice. Mark the player inactive before Riffy's
                // Connection.setStateUpdate() calls player.destroy(). This makes the
                // v3 active-playback guard allow this legitimate destroy instead of
                // leaving a zombie player in riffy.players.
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

    Riffy.prototype.createConnection = function(options) {
        const guildId = options?.guildId;
        const existingPlayer = guildId ? this.players?.get(guildId) : null;

        // Riffy 1.0.12 returns an existing player immediately from
        // createConnection(). If a previous disconnect was interrupted, that means a
        // disconnected/zombie player would be returned forever and /play could never
        // establish voice again. Remove it first so Riffy can create a fresh Player.
        const stalePlayer = existingPlayer && (
            existingPlayer.destroyed === true ||
            existingPlayer.connected === false ||
            !existingPlayer.connection
        );

        if (stalePlayer) {
            console.warn(`[ RIFFY VOICE ] Removing stale player before createConnection for guild ${guildId}; connected=${existingPlayer.connected === true} destroyed=${existingPlayer.destroyed === true}.`);

            try {
                // Make any installed active-playback guard allow the cleanup. A stale
                // player is already disconnected, so keeping playing=true has no
                // useful meaning.
                existingPlayer.playing = false;
                existingPlayer.paused = false;
                existingPlayer.destroy();
            } catch (error) {
                console.warn(`[ RIFFY VOICE ] Stale player destroy failed for guild ${guildId}: ${error?.message || error}`);
            } finally {
                // Player.destroy() normally removes itself, but delete explicitly in
                // case the old object is partially broken (for example connection=null).
                this.players?.delete(guildId);
            }
        }

        return originalCreateConnection.call(this, options);
    };

    Object.defineProperty(Riffy.prototype, '__dfordogVoiceLifecycleFixInstalled', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
    });

    console.log('[ RIFFY VOICE ] Lifecycle recovery patch installed (real disconnect + zombie player cleanup).');
}

installRiffyVoiceLifecycleFix();

module.exports = { installRiffyVoiceLifecycleFix };
