const { Riffy } = require('riffy');

/**
 * Compatibility/recovery patch for Riffy 1.0.12.
 *
 * The bot's lifecycle guard blocks stale async destroy() calls when a newer track
 * is already playing. Riffy itself also calls destroy() from
 * Connection.setStateUpdate() when Discord authoritatively reports the bot left
 * voice (VOICE_STATE_UPDATE with channel_id=null). That cleanup must be allowed.
 *
 * This file is preloaded by index.js before bot.js so the distinction is made at
 * the Riffy boundary and stale player objects cannot poison the next /play.
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
                // Discord is authoritative here. Mark the player inactive BEFORE
                // Connection.setStateUpdate() invokes destroy(), otherwise the v3
                // active-playback guard can mistake this legitimate cleanup for a
                // stale queueEnd cleanup and leave a zombie player in the map.
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

        // Riffy 1.0.12 returns an existing guild player immediately. If that object
        // is disconnected/half-destroyed, /play would keep receiving the same dead
        // player and waitForPlayerConnection() would time out forever.
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
