// Bounded recovery for Lavalink tracks lost before their expected end.
const EARLY_END_MARGIN_MS = 15000;
const MIN_TRACK_DURATION_MS = 30000;

function getPlaybackProgressMs(player, now = Date.now()) {
    const position = Number(player?.position);
    const lastPosition = Number.isFinite(position) && position > 0 ? position : 0;
    const startAt = Number(player?.__dfordogPlaybackExpectedAt);
    const elapsed = Number.isFinite(startAt) && startAt > 0 && startAt <= now
        ? now - startAt
        : 0;
    return Math.max(lastPosition, elapsed);
}

function isEarlyPlaybackInterruption(player, now = Date.now()) {
    const info = player?.current?.info;
    const duration = Number(info?.length);
    if (!info || info.isStream === true || player.paused === true) return false;
    if (!Number.isFinite(duration) || duration < MIN_TRACK_DURATION_MS) return false;
    return duration - getPlaybackProgressMs(player, now) > EARLY_END_MARGIN_MS;
}

async function retryInterruptedPlayback(player, remote, now = Date.now()) {
    if (player?.playing !== true || !isEarlyPlaybackInterruption(player, now)) return false;

    const guildId = player?.guildId;
    const currentTrack = player?.current;
    const encoded = currentTrack?.track || null;
    const riffy = player?.riffy;
    const rest = player?.node?.rest;

    if (!guildId || !encoded || !riffy || typeof rest?.updatePlayer !== 'function') return false;
    // A newer player has replaced this one; never replay or end the old one.
    if (riffy.players?.get(guildId) !== player) return true;
    if (player.__dfordogIntentionalStop || player.__dfordogHandshakeDead || player.__dfordogRetired) return false;
    if (player.node?.connected === false) return false;

    const botChannelId = riffy.client?.guilds?.cache?.get(guildId)
        ?.members?.me?.voice?.channelId || null;
    const targetChannel = player.voiceChannel || player.connection?.voiceChannel || null;
    if (!botChannelId || (targetChannel && botChannelId !== targetChannel)) return false;
    if (remote?.state?.connected === false) return false;

    const attemptKey = `${player.__dfordogRestPlaybackAttempt || 0}:${encoded}`;
    if (player.__dfordogRestRecoveryKey === attemptKey) return false;

    const duration = Number(currentTrack.info.length);
    const position = Math.min(getPlaybackProgressMs(player, now), duration - EARLY_END_MARGIN_MS);
    const data = { track: { encoded }, position: Math.max(0, Math.floor(position)) };

    // If Lavalink lost the whole remote player, re-send existing voice credentials.
    // Never log session IDs/tokens; the remote request logger may expose them.
    if (!remote) {
        const voice = player.connection?.voice;
        if (!voice?.sessionId || !voice?.endpoint || !voice?.token) return false;
        data.voice = {
            sessionId: voice.sessionId,
            endpoint: voice.endpoint,
            token: voice.token,
            channelId: targetChannel || botChannelId
        };
    }

    // One controlled retry per actual play() attempt, not one per REST poll.
    player.__dfordogRestRecoveryKey = attemptKey;

    try {
        await rest.updatePlayer({ guildId, data });
        if (riffy.players?.get(guildId) !== player || player.current !== currentTrack) return true;
        player.playing = true;
        player.__dfordogRestRemoteEmptySince = null;
        console.warn(`[ RIFFY REST ] Restored interrupted track for guild ${guildId} at ${Math.floor(position / 1000)}s; player stays in voice. Retry 1/1.`);
        return true;
    } catch (error) {
        console.error(`[ RIFFY REST ] Failed to resume early-ended track for guild ${guildId}: ${error?.message || error}`);
        return false;
    }
}

module.exports = {
    getPlaybackProgressMs,
    isEarlyPlaybackInterruption,
    retryInterruptedPlayback
};
