'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
    path.join(__dirname, '..', 'utils', 'riffyVoiceJoinStateFix.js'),
    'utf8'
);

function createRiffyHarness() {
    class Player {
        constructor(riffy, guildId, voiceChannel) {
            this.riffy = riffy;
            this.guildId = guildId;
            this.voiceChannel = voiceChannel;
            this.connection = { voiceChannel };
            this.connected = true;
            this.playing = false;
            this.paused = false;
            this.current = null;
            this.connectCalls = 0;
        }

        connect() {
            this.connectCalls++;
            return this;
        }

        destroy() {
            this.riffy.players.delete(this.guildId);
        }
    }

    class Riffy {
        constructor() {
            this.clientId = 'test-bot';
            this.client = { user: { id: this.clientId }, guilds: { cache: new Map() } };
            this.players = new Map();
            this.nativeVoiceStatePackets = [];
        }

        createConnection(options) {
            const player = new Player(this, options.guildId, options.voiceChannel);
            this.players.set(options.guildId, player);
            return player;
        }

        async updateVoiceState(packet) {
            this.nativeVoiceStatePackets.push(packet);
            if (packet?.t === 'VOICE_STATE_UPDATE' &&
                packet.d.user_id === this.clientId &&
                packet.d.channel_id == null) {
                this.players.delete(packet.d.guild_id);
            }
        }
    }

    class StatusManager {}

    const module = { exports: {} };
    vm.runInNewContext(source, {
        module,
        exports: module.exports,
        require(id) {
            if (id === 'riffy') return { Riffy, Player };
            if (id === 'discord.js') return { ActivityType: { Listening: 2 } };
            if (id === './statusManager.js') return StatusManager;
            throw new Error(`Unexpected module import: ${id}`);
        },
        console: { log() {}, warn() {} },
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval
    }, { filename: 'riffyVoiceJoinStateFix.js' });

    return { riffy: new Riffy(), Player };
}

function botVoiceUpdate(channelId) {
    return {
        t: 'VOICE_STATE_UPDATE',
        d: { guild_id: 'test-guild', user_id: 'test-bot', channel_id: channelId }
    };
}

test('Discord disconnect respects moderator action while music is active', async () => {
    const { riffy } = createRiffyHarness();
    const player = riffy.createConnection({ guildId: 'test-guild', voiceChannel: 'test-voice' });
    player.playing = true;
    player.current = { info: { title: 'test song' } };

    await riffy.updateVoiceState(botVoiceUpdate(null));

    assert.equal(riffy.nativeVoiceStatePackets.length, 1, 'must forward leave to Riffy cleanup');
    assert.equal(riffy.players.has('test-guild'), false, 'old player must be removed');
    assert.equal(player.connectCalls, 0, 'the bot must not rejoin an externally disconnected call');
});

test('Delayed old disconnect acknowledgment does not remove a replacement player', async () => {
    const { riffy, Player } = createRiffyHarness();
    const oldPlayer = new Player(riffy, 'test-guild', 'old-voice');
    const replacement = riffy.createConnection({ guildId: 'test-guild', voiceChannel: 'new-voice' });
    replacement.__dfordogVoiceJoinStartedAt = Date.now();
    riffy.__dfordogVoiceDisconnectRequests = new Map([
        ['test-guild', { at: Date.now(), player: oldPlayer }]
    ]);

    await riffy.updateVoiceState(botVoiceUpdate(null));

    assert.equal(riffy.nativeVoiceStatePackets.length, 0, 'stale leave must be ignored');
    assert.equal(riffy.players.get('test-guild'), replacement);
    assert.equal(replacement.connectCalls, 0);
});

test('Fresh /play can create a new connection after the bot was manually disconnected', async () => {
    const { riffy } = createRiffyHarness();
    const first = riffy.createConnection({ guildId: 'test-guild', voiceChannel: 'test-voice' });
    await riffy.updateVoiceState(botVoiceUpdate(null));

    const next = riffy.createConnection({ guildId: 'test-guild', voiceChannel: 'test-voice' });

    assert.notEqual(next, first);
    assert.equal(riffy.players.get('test-guild'), next);
});
