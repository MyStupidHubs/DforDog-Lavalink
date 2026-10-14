const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const {
    getPlaybackProgressMs,
    isEarlyPlaybackInterruption,
    retryInterruptedPlayback
} = require('../utils/earlyPlaybackRecovery');

const NOW = 1000000;
function createPlayer(overrides = {}) {
    const player = {
        guildId: 'g1',
        voiceChannel: 'v1',
        playing: true,
        paused: false,
        current: { track: 'encoded-track', info: { length: 180000 } },
        position: 60000,
        __dfordogPlaybackExpectedAt: NOW - 65000,
        connection: { voice: { sessionId: 'session', endpoint: 'endpoint', token: 'secret' } },
        node: {
            connected: true,
            rest: {
                async updatePlayer(payload) {
                    player.lastUpdate = payload;
                }
            }
        },
        ...overrides
    };
    player.riffy = {
        players: new Map([['g1', player]]),
        client: { guilds: { cache: new Map([['g1', { members: { me: { voice: { channelId: 'v1' } } } }]]) } }
    };
    return player;
}

test('distinguishes early interruptions from natural endings, streams and pauses', () => {
    assert.equal(getPlaybackProgressMs(createPlayer(), NOW), 65000);
    assert.equal(isEarlyPlaybackInterruption(createPlayer(), NOW), true);
    assert.equal(isEarlyPlaybackInterruption(createPlayer({ position: 177000, __dfordogPlaybackExpectedAt: NOW - 177000 }), NOW), false);
    assert.equal(isEarlyPlaybackInterruption(createPlayer({ paused: true }), NOW), false);
    assert.equal(isEarlyPlaybackInterruption(createPlayer({
        current: { track: 'encoded-track', info: { length: 180000, isStream: true } }
    }), NOW), false);
});

test('resumes an interrupted remote player at the last known position, at most once', async () => {
    const player = createPlayer();
    const first = await retryInterruptedPlayback(player, { guildId: 'g1', track: null, state: { connected: true } }, NOW);
    assert.equal(first, true);
    assert.equal(player.lastUpdate.data.position, 65000);
    assert.equal(player.lastUpdate.data.track.encoded, 'encoded-track');

    const second = await retryInterruptedPlayback(player, { guildId: 'g1', track: null }, NOW);
    assert.equal(second, false);
});

test('recreates a vanished Lavalink player with existing voice credentials', async () => {
    const player = createPlayer();
    assert.equal(await retryInterruptedPlayback(player, null, NOW), true);
    assert.deepEqual(player.lastUpdate.data.voice, {
        sessionId: 'session',
        endpoint: 'endpoint',
        token: 'secret',
        channelId: 'v1'
    });
});

test('never recovers a stopped player or a disconnected Discord bot', async () => {
    const player = createPlayer({ playing: false });
    assert.equal(await retryInterruptedPlayback(player, null, NOW), false);
    const other = createPlayer();
    other.riffy.client.guilds.cache.get('g1').members.me.voice.channelId = null;
    assert.equal(await retryInterruptedPlayback(other, null, NOW), false);
});

// Isolate the raw handler from discord.js so this test can run without
// booting the Discord client or connecting to a real server.
let handleRaw;
const originalLoad = Module._load;
try {
    Module._load = function(request, parent, isMain) {
        if (request === 'discord.js') {
            return { GatewayDispatchEvents: { VoiceStateUpdate: 'VOICE_STATE_UPDATE' } };
        }
        return originalLoad.apply(this, arguments);
    };
    handleRaw = require('../events/raw');
} finally {
    Module._load = originalLoad;
}

function createVoiceContext() {
    let destroyed = 0;
    const player = {
        guildId: 'g1',
        connection: {},
        playing: true,
        destroy() {
            destroyed++;
            riffy.players.delete('g1');
        }
    };
    const riffy = { players: new Map([['g1', player]]) };
    const guild = { members: { me: { voice: { channelId: null } } } };
    const client = { riffy, user: { id: 'bot' }, guilds: { cache: new Map([['g1', guild]]) } };
    const packet = { t: 'VOICE_STATE_UPDATE', d: { user_id: 'bot', guild_id: 'g1', channel_id: null } };
    return { client, guild, riffy, player, packet, destroyCount: () => destroyed };
}

test('does not destroy the player during a deliberate handshake leave/rejoin', () => {
    const ctx = createVoiceContext();
    ctx.player.__dfordogHandshakeRecovery = { phase: 'rejoining', startedAt: Date.now() };
    handleRaw(ctx.client, ctx.packet);
    assert.equal(ctx.destroyCount(), 0);
});

test('does not destroy a replacement player due to an old leave acknowledgment', () => {
    const ctx = createVoiceContext();
    const date = Date.now();
    ctx.player.__dfordogVoiceJoinStartedAt = date;
    ctx.riffy.__dfordogVoiceDisconnectRequests = new Map([['g1', { player: {}, at: date }]]);
    handleRaw(ctx.client, ctx.packet);
    assert.equal(ctx.destroyCount(), 0);
});

test('fallback removes an actually disconnected player only after native cleanup had a chance', async () => {
    const ctx = createVoiceContext();
    handleRaw(ctx.client, ctx.packet);
    assert.equal(ctx.destroyCount(), 0);
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal(ctx.destroyCount(), 1);
});

test('fallback retains the player when Discord still has the bot in voice', async () => {
    const ctx = createVoiceContext();
    handleRaw(ctx.client, ctx.packet);
    ctx.guild.members.me.voice.channelId = 'v1';
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal(ctx.destroyCount(), 0);
});
