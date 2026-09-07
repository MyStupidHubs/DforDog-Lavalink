const { Riffy, Player } = require('riffy');

const INITIAL_RECOVERY_DELAY_MS = 3000;
const LEAVE_ACK_TIMEOUT_MS = 900;
const RETRY_CONFIRM_TIMEOUT_MS = 3000;
const STALE_REUSE_AGE_MS = 5500;
const RECOVERY_PACKET_WINDOW_MS = 6500;

function getActualBotVoiceChannelId(client, guildId) {
    return client?.guilds?.cache?.get(guildId)?.members?.me?.voice?.channelId || null;
}

function normalizeTarget(player, options = {}) {
    return {
        guildId: options.guildId || player?.guildId,
        voiceChannel: options.voiceChannel || player?.voiceChannel || player?.connection?.voiceChannel || null,
        textChannel: options.textChannel || player?.textChannel || null,
        deaf: options.deaf ?? player?.deaf ?? true,
        mute: options.mute ?? player?.mute ?? false
    };
}

function isVoiceConfirmed(player, target = null) {
    if (!player || player.__dfordogHandshakeDead === true) return false;
    if (player.connected !== true || !player.connection) return false;

    const guildId = target?.guildId || player.guildId;
    const expected = target?.voiceChannel || player.voiceChannel || player.connection?.voiceChannel || null;
    const actual = getActualBotVoiceChannelId(player.riffy?.client, guildId);

    if (!actual) return false;
    if (expected && actual !== expected) return false;

    return true;
}

function clearTimer(player, key) {
    const timer = player?.[key];
    if (!timer) return;
    clearTimeout(timer);
    player[key] = null;
}

function clearRecoveryTimers(player) {
    clearTimer(player, '__dfordogHandshakeInitialTimer');
    clearTimer(player, '__dfordogHandshakeLeaveAckTimer');
    clearTimer(player, '__dfordogHandshakeFinalTimer');
}

function finishRecovery(player, recovered = false) {
    if (!player) return;

    const attempts = player.__dfordogHandshakeRecoveryAttempts || 0;
    clearRecoveryTimers(player);
    player.__dfordogHandshakeRecovery = null;

    if (recovered && attempts > 0) {
        console.log(`[ RIFFY HANDSHAKE ] Voice recovery succeeded for guild ${player.guildId}; confirmed in channel ${getActualBotVoiceChannelId(player.riffy?.client, player.guildId) || player.voiceChannel || 'unknown'}.`);
    }
}

function resetConnectionForRetry(player, target) {
    const connection = player?.connection;
    if (!connection || !target?.voiceChannel) return false;

    player.connected = false;
    player.voiceChannel = target.voiceChannel;
    player.textChannel = target.textChannel || player.textChannel;

    connection.establishing = false;
    connection.pendingUpdate = null;
    connection.deferred = null;
    connection.sessionId = null;
    connection.voiceChannel = target.voiceChannel;

    if (connection.voice) {
        connection.voice.sessionId = null;
        connection.voice.endpoint = null;
        connection.voice.token = null;
    }

    return true;
}

function retireFailedHandshake(player, reason) {
    if (!player || player.__dfordogHandshakeDead === true) return;

    const riffy = player.riffy;
    const guildId = player.guildId;
    const client = riffy?.client;
    const actualVoice = getActualBotVoiceChannelId(client, guildId);

    console.warn(`[ RIFFY HANDSHAKE ] Giving up failed voice handshake for guild ${guildId}; removing zombie player. reason=${reason}.`);

    clearRecoveryTimers(player);
    player.__dfordogHandshakeRecovery = null;
    player.__dfordogHandshakeDead = true;
    player.playing = false;
    player.paused = false;
    player.connected = false;

    try {
        player.queue?.clear?.();
    } catch (_) {}

    // If Discord still shows the bot in voice, explicitly request a leave. We do not
    // call Player.destroy() here because the delayed channel_id=null acknowledgement
    // must not race a replacement player into destruction.
    if (actualVoice) {
        try {
            player.send?.({
                guild_id: guildId,
                channel_id: null,
                self_mute: false,
                self_deaf: false
            });
        } catch (error) {
            console.warn(`[ RIFFY HANDSHAKE ] Failed requesting voice leave for guild ${guildId}: ${error?.message || error}`);
        }
    }

    try {
        const result = player.node?.rest?.destroyPlayer?.(guildId);
        if (result && typeof result.catch === 'function') {
            result.catch((error) => {
                console.warn(`[ RIFFY HANDSHAKE ] Failed deleting Lavalink zombie for guild ${guildId}: ${error?.message || error}`);
            });
        }
    } catch (error) {
        console.warn(`[ RIFFY HANDSHAKE ] Failed deleting Lavalink zombie for guild ${guildId}: ${error?.message || error}`);
    }

    if (riffy?.players?.get(guildId) === player) {
        riffy.players.delete(guildId);
    }

    if (client?.statusManager?.onPlayerDisconnect) {
        Promise.resolve(client.statusManager.onPlayerDisconnect(guildId)).catch(() => {});
    }
}

function armFinalConfirmation(player, target) {
    if (!player || !target?.voiceChannel) return;

    clearTimer(player, '__dfordogHandshakeFinalTimer');
    const timer = setTimeout(() => {
        player.__dfordogHandshakeFinalTimer = null;

        if (isVoiceConfirmed(player, target)) {
            finishRecovery(player, true);
            return;
        }

        retireFailedHandshake(player, 'automatic leave/rejoin retry was not confirmed');
    }, RETRY_CONFIRM_TIMEOUT_MS);

    timer.unref?.();
    player.__dfordogHandshakeFinalTimer = timer;
}

function retryJoin(player, source) {
    if (!player || player.__dfordogHandshakeDead === true) return;

    const riffy = player.riffy;
    const guildId = player.guildId;
    const marker = player.__dfordogHandshakeRecovery;
    const target = marker?.target || player.__dfordogHandshakeTarget;

    if (!riffy || riffy.players?.get(guildId) !== player || !target?.voiceChannel || !player.connection) {
        retireFailedHandshake(player, 'player disappeared before retry join');
        return;
    }

    clearTimer(player, '__dfordogHandshakeLeaveAckTimer');

    if (!resetConnectionForRetry(player, target)) {
        retireFailedHandshake(player, 'connection object unavailable before retry join');
        return;
    }

    marker.phase = 'rejoining';
    marker.rejoinAt = Date.now();

    console.warn(`[ RIFFY HANDSHAKE ] Rejoining voice for guild ${guildId} after ${source}; target=${target.voiceChannel}.`);

    try {
        player.__dfordogHandshakeInternalConnect = true;
        player.connect(target);
    } catch (error) {
        delete player.__dfordogHandshakeInternalConnect;
        retireFailedHandshake(player, `retry connect threw: ${error?.message || error}`);
        return;
    }

    armFinalConfirmation(player, target);
}

function beginRecovery(player, reason) {
    if (!player || player.__dfordogHandshakeDead === true) return;

    const target = player.__dfordogHandshakeTarget || normalizeTarget(player);
    const riffy = player.riffy;
    const guildId = player.guildId;

    if (!target.voiceChannel || !riffy || riffy.players?.get(guildId) !== player) return;
    if (isVoiceConfirmed(player, target)) {
        finishRecovery(player, false);
        return;
    }

    const currentMarker = player.__dfordogHandshakeRecovery;
    if (currentMarker && Date.now() - currentMarker.startedAt < RECOVERY_PACKET_WINDOW_MS) {
        return;
    }

    const attempts = player.__dfordogHandshakeRecoveryAttempts || 0;
    if (attempts >= 1) {
        retireFailedHandshake(player, 'voice handshake remained unconfirmed after one automatic recovery');
        return;
    }

    clearRecoveryTimers(player);
    player.__dfordogHandshakeRecoveryAttempts = attempts + 1;
    player.__dfordogHandshakeRecovery = {
        startedAt: Date.now(),
        phase: 'leaving',
        target,
        reason
    };

    player.connected = false;

    const actualVoice = getActualBotVoiceChannelId(riffy.client, guildId);
    console.warn(`[ RIFFY HANDSHAKE ] Voice handshake stalled for guild ${guildId}; automatic recovery #${attempts + 1}. actualVoice=${actualVoice || 'none'} target=${target.voiceChannel} reason=${reason}.`);

    if (!actualVoice) {
        const timer = setTimeout(() => retryJoin(player, 'bot was already outside voice'), 120);
        timer.unref?.();
        player.__dfordogHandshakeLeaveAckTimer = timer;
        return;
    }

    try {
        player.send?.({
            guild_id: guildId,
            channel_id: null,
            self_mute: false,
            self_deaf: false
        });
    } catch (error) {
        console.warn(`[ RIFFY HANDSHAKE ] Recovery leave request failed for guild ${guildId}: ${error?.message || error}`);
    }

    const timer = setTimeout(() => {
        player.__dfordogHandshakeLeaveAckTimer = null;
        retryJoin(player, 'leave acknowledgement timeout');
    }, LEAVE_ACK_TIMEOUT_MS);

    timer.unref?.();
    player.__dfordogHandshakeLeaveAckTimer = timer;
}

function armInitialRecovery(player, options = {}, delayMs = INITIAL_RECOVERY_DELAY_MS) {
    if (!player || player.__dfordogHandshakeDead === true) return;

    const target = normalizeTarget(player, options);
    if (!target.guildId || !target.voiceChannel) return;

    player.__dfordogHandshakeTarget = target;

    if (isVoiceConfirmed(player, target)) {
        finishRecovery(player, false);
        return;
    }

    if (player.__dfordogHandshakeRecovery) return;
    if (player.__dfordogHandshakeInitialTimer) return;

    const timer = setTimeout(() => {
        player.__dfordogHandshakeInitialTimer = null;
        beginRecovery(player, delayMs === 0 ? 'stale player reused by /play' : 'initial join was not confirmed');
    }, Math.max(0, delayMs));

    timer.unref?.();
    player.__dfordogHandshakeInitialTimer = timer;
}

function installVoiceHandshakeRecovery() {
    if (global.__dfordogVoiceHandshakeRecoveryV12) return;
    global.__dfordogVoiceHandshakeRecoveryV12 = true;

    if (Player?.prototype && !Player.prototype.__dfordogHandshakePlayerPatchV12) {
        const previousConnect = Player.prototype.connect;
        const previousDestroy = Player.prototype.destroy;
        const previousDisconnect = Player.prototype.disconnect;

        Player.prototype.connect = function(options = {}) {
            const internalRecoveryConnect = this.__dfordogHandshakeInternalConnect === true;
            delete this.__dfordogHandshakeInternalConnect;

            const result = previousConnect.call(this, options);
            const target = normalizeTarget(this, options);
            this.__dfordogHandshakeTarget = target;
            this.__dfordogHandshakeDead = false;

            if (!internalRecoveryConnect) {
                this.__dfordogHandshakeRecoveryAttempts = 0;
                finishRecovery(this, false);
                armInitialRecovery(this, target);
            }

            return result;
        };

        Player.prototype.destroy = function(...args) {
            finishRecovery(this, false);
            this.__dfordogHandshakeDead = true;
            return previousDestroy.apply(this, args);
        };

        Player.prototype.disconnect = function(...args) {
            finishRecovery(this, false);
            return previousDisconnect.apply(this, args);
        };

        Object.defineProperty(Player.prototype, '__dfordogHandshakePlayerPatchV12', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
    }

    if (Riffy?.prototype && !Riffy.prototype.__dfordogHandshakeRiffyPatchV12) {
        const previousCreateConnection = Riffy.prototype.createConnection;
        const previousUpdateVoiceState = Riffy.prototype.updateVoiceState;
        const previousInit = Riffy.prototype.init;

        Riffy.prototype.createConnection = function(options) {
            const guildId = options?.guildId;
            const before = guildId ? this.players?.get(guildId) : null;
            const player = previousCreateConnection.call(this, options);

            if (!player) return player;

            const target = normalizeTarget(player, options);
            player.__dfordogHandshakeTarget = target;

            if (!isVoiceConfirmed(player, target)) {
                const age = player.__dfordogVoiceJoinStartedAt
                    ? Date.now() - player.__dfordogVoiceJoinStartedAt
                    : Infinity;
                const reusedStalePlayer = before === player &&
                    age >= STALE_REUSE_AGE_MS &&
                    (player.playing !== true || !player.current);

                if (reusedStalePlayer) {
                    clearTimer(player, '__dfordogHandshakeInitialTimer');
                    armInitialRecovery(player, target, 0);
                } else {
                    armInitialRecovery(player, target);
                }
            }

            return player;
        };

        Riffy.prototype.updateVoiceState = async function(packet) {
            const guildId = packet?.d?.guild_id;
            const player = guildId ? this.players?.get(guildId) : null;
            const marker = player?.__dfordogHandshakeRecovery;
            const isBotPacket = packet?.d?.user_id === this.clientId || packet?.t === 'VOICE_SERVER_UPDATE';
            const markerFresh = marker && Date.now() - marker.startedAt <= RECOVERY_PACKET_WINDOW_MS;

            if (player && markerFresh && isBotPacket) {
                if (packet.t === 'VOICE_SERVER_UPDATE' && marker.phase === 'leaving') {
                    console.warn(`[ RIFFY HANDSHAKE ] Ignoring stale VOICE_SERVER_UPDATE while resetting guild ${guildId}.`);
                    return;
                }

                if (packet.t === 'VOICE_STATE_UPDATE' && packet.d.user_id === this.clientId && packet.d.channel_id == null) {
                    if (marker.phase === 'leaving') {
                        console.warn(`[ RIFFY HANDSHAKE ] Discord confirmed recovery leave for guild ${guildId}; retrying join.`);
                        clearTimer(player, '__dfordogHandshakeLeaveAckTimer');
                        const timer = setTimeout(() => retryJoin(player, 'Discord leave acknowledgement'), 120);
                        timer.unref?.();
                        player.__dfordogHandshakeLeaveAckTimer = timer;
                    } else {
                        console.warn(`[ RIFFY HANDSHAKE ] Ignoring delayed recovery channel_id=null for guild ${guildId}; rejoin is already in progress.`);
                    }
                    return;
                }
            }

            const result = await previousUpdateVoiceState.call(this, packet);

            if (player && markerFresh && packet?.t === 'VOICE_STATE_UPDATE' &&
                packet?.d?.user_id === this.clientId && packet?.d?.channel_id === marker.target?.voiceChannel) {
                marker.sawTargetVoiceStateAt = Date.now();
            }

            return result;
        };

        Riffy.prototype.init = function(...args) {
            const result = previousInit.apply(this, args);

            if (!this.__dfordogHandshakePlayerUpdateListenerV12) {
                this.on('playerUpdate', (player) => {
                    if (!player?.__dfordogHandshakeTarget) return;
                    if (!isVoiceConfirmed(player, player.__dfordogHandshakeTarget)) return;
                    finishRecovery(player, true);
                });
                this.__dfordogHandshakePlayerUpdateListenerV12 = true;
            }

            return result;
        };

        Object.defineProperty(Riffy.prototype, '__dfordogHandshakeRiffyPatchV12', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
    }

    console.log('[ RIFFY HANDSHAKE ] v12 self-healing voice handshake recovery installed (one leave/rejoin retry + zombie cleanup).');
}

installVoiceHandshakeRecovery();

module.exports = { installVoiceHandshakeRecovery };
