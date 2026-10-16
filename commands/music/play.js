const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const config = require('../../config.js');
const SpotifyWebApi = require('spotify-web-api-node');
const { getData } = require('spotify-url-info')(require('node-fetch'));
const { sendErrorResponse, handleCommandError, safeDeferReply, buildPaleCard, sanitizeTitle, stripLeadingIcons } = require('../../utils/responseHandler.js');
const { checkVoiceChannel: checkVC } = require('../../utils/voiceChannelCheck.js');
const { getActualBotVoiceChannelId, retireStalePlayerWithoutGatewayDisconnect } = require('../../utils/riffyVoiceJoinStateFix.js');
const { waitForPendingPlayerDelete } = require('../../utils/riffyVoiceLifecycleFix.js');
const { getLavalinkManager } = require('../../lavalink.js');
const { getLang } = require('../../utils/languageLoader');
const { getEmoji } = require('../../UI/emojis/emoji');
const requesters = new Map();

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    return [
        hours > 0 ? `${hours}h` : null,
        minutes > 0 ? `${minutes}m` : null,
        `${seconds}s`,
    ]
        .filter(Boolean)
        .join(' ');
}

const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play a song from a name or link")
  .addStringOption(option =>
    option.setName("name")
      .setDescription("Enter song name / link or playlist")
      .setRequired(true)
      .setAutocomplete(true)
  );

const spotifyApi = new SpotifyWebApi({
    clientId: config.spotifyClientId, 
    clientSecret: config.spotifyClientSecret,
});

async function waitForPlayerConnection(client, player, timeoutMs = 12000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        // local connected=true is insufficient: it can survive after Discord
        // has already removed the bot from voice.
        const actualChannel = getActualBotVoiceChannelId(client, player?.guildId);
        if (player?.connected === true && actualChannel &&
            actualChannel === (player.voiceChannel || player.connection?.voiceChannel)) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return false;
}


const voiceJoinLocks = new Map();

async function withGuildVoiceJoinLock(guildId, task) {
    const previous = voiceJoinLocks.get(guildId) || Promise.resolve();
    const current = previous.catch(() => {}).then(task);
    voiceJoinLocks.set(guildId, current);

    try {
        return await current;
    } finally {
        if (voiceJoinLocks.get(guildId) === current) {
            voiceJoinLocks.delete(guildId);
        }
    }
}

async function getOrCreateVoicePlayer(client, interaction, nodeManager, userVoiceChannel, forceFresh = false) {
    const guildId = interaction.guildId;

    return withGuildVoiceJoinLock(guildId, async () => {
        // Riffy Player.destroy() does not await its HTTP DELETE. If /play
        // starts while that request is still in flight, it can delete the
        // freshly created player on the Lavalink side.
        await waitForPendingPlayerDelete(guildId);
        const actualBotVoiceChannelId = getActualBotVoiceChannelId(client, guildId);
        // The command has already checked this, but another user may have
        // moved the bot while node availability was being checked.
        if (actualBotVoiceChannelId && actualBotVoiceChannelId !== userVoiceChannel) {
            throw new Error('Bot moved to another voice channel; join its channel before running /play.');
        }

        const oldPlayer = client.riffy.players.get(guildId);
        if (oldPlayer) {
            const now = Date.now();
            const joinAge = now - (oldPlayer.__dfordogVoiceJoinStartedAt || 0);
            const unexpectedRejoinAge = now - (oldPlayer.__dfordogUnexpectedRejoinAt || 0);
            const recoveryAge = now - (oldPlayer.__dfordogHandshakeRecovery?.startedAt || 0);
            const confirmedLeaveAfterJoin = !!oldPlayer.__dfordogBotVoiceLeftAt &&
                oldPlayer.__dfordogBotVoiceLeftAt > (oldPlayer.__dfordogBotVoiceJoinedAt || 0) &&
                !oldPlayer.__dfordogHandshakeRecovery;
            const joinInProgress = !!oldPlayer.connection && !confirmedLeaveAfterJoin &&
                (joinAge < 12000 || unexpectedRejoinAge < 12000 ||
                    (oldPlayer.__dfordogHandshakeRecovery && recoveryAge < 12000));
            const target = oldPlayer.voiceChannel || oldPlayer.connection?.voiceChannel || null;
            const absentFromDiscord = !actualBotVoiceChannelId && !joinInProgress;
            const wrongStoredChannel = !!actualBotVoiceChannelId &&
                target !== actualBotVoiceChannelId && !joinInProgress;
            const incomplete = !oldPlayer.connection ||
                oldPlayer.__dfordogRetired === true || oldPlayer.__dfordogHandshakeDead === true;

            if (forceFresh || absentFromDiscord || wrongStoredChannel || incomplete) {
                console.warn('[ RIFFY PLAY ] Stale voice player detected guild=' + guildId +
                    ' DiscordChannel=' + (actualBotVoiceChannelId || 'none') +
                    ' RiffyChannel=' + (target || 'none') +
                    ' localConnected=' + (oldPlayer.connected === true) +
                    ' confirmedLeave=' + confirmedLeaveAfterJoin +
                    ' forceFresh=' + forceFresh);

                // Invalidate and await the OLD Lavalink player deletion before
                // creating the replacement. Never send Discord channel_id=null:
                // a delayed leave acknowledgment can disconnect the new join.
                const { cleanupTrackMessages } = require('../../player.js');
                await cleanupTrackMessages(client, oldPlayer).catch((error) => {
                    console.warn('[ RIFFY PLAY ] Old track card cleanup failed: ' + (error?.message || error));
                });
                if (client.riffy.players.get(guildId) === oldPlayer) {
                    const retired = await retireStalePlayerWithoutGatewayDisconnect(
                        client.riffy, oldPlayer, 'Discord voice no longer matches the Riffy player'
                    );
                    if (retired === false) {
                        throw new Error('Lavalink could not remove the previous disconnected player');
                    }
                }
            }
        }

        await nodeManager.checkAllNodesHealth().catch(() => {});
        await nodeManager.forceConnectAllNodes().catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 400));

        // Recheck after other health tasks: a late old DELETE must be fully
        // complete before allocating the new player for this guild.
        await waitForPendingPlayerDelete(guildId);

        let player;
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
            await nodeManager.ensureNodeAvailable();
            try {
                player = client.riffy.createConnection({
                    guildId,
                    voiceChannel: userVoiceChannel,
                    textChannel: interaction.channelId,
                    deaf: true
                });
                break;
            } catch (err) {
                attempts++;
                const msg = err?.message || '';
                if (attempts < maxAttempts &&
                    (msg.includes('No nodes are available') || msg.includes('fetch failed'))) {
                    await nodeManager.reconnectNodesNow?.(5000).catch(() => {});
                    await nodeManager.ensureNodeAvailable();
                    await new Promise(resolve => setTimeout(resolve, 700));
                    continue;
                }
                if (attempts >= maxAttempts) {
                    await nodeManager.refreshRiffy?.();
                    await nodeManager.ensureNodeAvailable();
                    player = client.riffy.createConnection({
                        guildId,
                        voiceChannel: userVoiceChannel,
                        textChannel: interaction.channelId,
                        deaf: true
                    });
                    break;
                }
                throw err;
            }
        }
        if (!player) throw new Error('Unable to create a Lavalink voice player.');
        return player;
    });
}

async function getConnectedVoicePlayer(client, interaction, nodeManager, targetChannel) {
    let player = await getOrCreateVoicePlayer(client, interaction, nodeManager, targetChannel);
    if (await waitForPlayerConnection(client, player, 8000)) return player;

    const actual = getActualBotVoiceChannelId(client, interaction.guildId);
    if (actual && actual !== targetChannel) {
        throw new Error('The bot is currently connected to another voice channel.');
    }

    if (actual) {
        // Discord is in the right channel but Lavalink never confirmed voice.
        // Do not issue a second join blindly while the first handshake is live.
        throw new Error('Discord voice joined, but Lavalink did not confirm the voice handshake.');
    }

    // No bot is present in Discord. Replace the stale/failed attempt once
    // without asking the user to remove and re-add the bot manually.
    console.warn(`[ RIFFY PLAY ] Join timed out guild=${interaction.guildId}; Discord still has no bot voice state. Clearing the failed player and retrying one fresh join.`);
    player = await getOrCreateVoicePlayer(
        client, interaction, nodeManager, targetChannel, true
    );

    if (await waitForPlayerConnection(client, player, 12000)) return player;
    throw new Error('Discord voice join was not confirmed after one automatic retry.');
}

async function getSpotifyPlaylistTracks(playlistId) {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body.access_token);

        let tracks = [];
        let offset = 0;
        let limit = 100;
        let total = 0;

        do {
            const response = await spotifyApi.getPlaylistTracks(playlistId, { limit, offset });
            total = response.body.total;
            offset += limit;

            for (const item of response.body.items) {
                if (item.track && item.track.name && item.track.artists) {
                    const trackName = `${item.track.name} - ${item.track.artists.map(a => a.name).join(', ')}`;
                    tracks.push(trackName);
                }
            }
        } while (tracks.length < total);

        return tracks;
    } catch (error) {
        console.error("Error fetching Spotify playlist tracks:", error);
        return [];
    }
}

module.exports = {
    data: data,
    run: async (client, interaction) => {
        try {
            // Handle autocomplete
            if (interaction.isAutocomplete()) {
                const focusedOption = interaction.options.getFocused(true);
                if (focusedOption.name === 'name') {
                    const query = focusedOption.value;
                    if (query.length < 2) {
                        return interaction.respond([]);
                    }

                    try {
                        const nodeManager = getLavalinkManager();
                        if (!nodeManager) {
                            return interaction.respond([]);
                        }

                        await nodeManager.ensureNodeAvailable();
                        const resolve = await client.riffy.resolve({ query, requester: interaction.user.username });

                        if (resolve && resolve.tracks && resolve.tracks.length > 0) {
                            const choices = resolve.tracks.slice(0, 25).map(track => {
                                const info = track.info;
                                const duration = formatDuration(info.length);
                                const display = `${info.title} - ${info.author} (${duration})`;
                                return {
                                    name: display.length > 100 ? display.substring(0, 97) + '...' : display,
                                    value: info.uri || query
                                };
                            });
                            return interaction.respond(choices);
                        } else {
                            return interaction.respond([]);
                        }
                    } catch (error) {
                        console.error('Autocomplete error:', error);
                        return interaction.respond([]);
                    }
                }
            }

            const lang = await getLang(interaction.guildId);
            const t = lang.music.play;

            const query = interaction.options.getString('name');

            const deferred = await safeDeferReply(interaction);

            if (!deferred && !interaction.deferred && !interaction.replied) return;
            const existingPlayer = client.riffy.players.get(interaction.guildId);
            const voiceCheck = await checkVC(interaction, existingPlayer);
            if (!voiceCheck.allowed) {
                const reply = await interaction.editReply(voiceCheck.response);
                setTimeout(() => reply.delete().catch(() => {}), 5000);
                return reply;
            }

            const nodeManager = getLavalinkManager();
            if (!nodeManager) {
                return sendErrorResponse(
                    interaction,
                    t.lavalinkManagerError.title + '\n\n' +
                    t.lavalinkManagerError.message + '\n' +
                    t.lavalinkManagerError.note,
                    5000
                );
            }
            
            try {
                await nodeManager.ensureNodeAvailable();
            } catch (error) {
                const nodeCount = nodeManager.getNodeCount();
                const totalCount = nodeManager.getTotalNodeCount();
                return sendErrorResponse(
                    interaction,
                    t.noNodes.title + '\n\n' +
                    t.noNodes.message
                        .replace('{connected}', nodeCount)
                        .replace('{total}', totalCount) + '\n' +
                    t.noNodes.note,
                    5000
                );
            }

            const userVoiceChannel = interaction.member.voice.channelId;
            // Confirm the voice join before adding tracks. A failed join can
            // now be retired and retried without losing a freshly queued song.
            const player = await getConnectedVoicePlayer(client, interaction, nodeManager, userVoiceChannel);

            let tracksToQueue = [];
            let isPlaylist = false;

            if (query.includes('spotify.com')) {
                try {
                    const spotifyData = await getData(query);

                    if (spotifyData.type === 'track') {
                        const trackName = `${spotifyData.name} - ${spotifyData.artists.map(a => a.name).join(', ')}`;
                        tracksToQueue.push(trackName);
                    } else if (spotifyData.type === 'playlist') {
                        isPlaylist = true;
                        const playlistId = query.split('/playlist/')[1].split('?')[0]; 
                        tracksToQueue = await getSpotifyPlaylistTracks(playlistId);
                    }
                } catch (err) {
                    console.error('Error fetching Spotify data:', err);
                    return sendErrorResponse(
                        interaction,
                        t.spotifyError.title + '\n\n' +
                        t.spotifyError.message + '\n' +
                        t.spotifyError.note,
                        5000
                    );
                }
            } else {
                let resolve;
                try {
                    resolve = await client.riffy.resolve({ query, requester: interaction.user.username });
                } catch (err) {
                    const msg = err?.message || '';
                    if (msg.includes('fetch failed') || msg.includes('No nodes are available') || (err.cause && err.cause.code === 'ECONNREFUSED')) {
                        await nodeManager.reconnectNodesNow?.(5000).catch(() => {});
                        await nodeManager.ensureNodeAvailable();
                        resolve = await client.riffy.resolve({ query, requester: interaction.user.username });
                    } else {
                        throw err;
                    }
                }

                if (!resolve || typeof resolve !== 'object' || !Array.isArray(resolve.tracks)) {
                    return sendErrorResponse(
                        interaction,
                        t.invalidResponse.title + '\n\n' +
                        t.invalidResponse.message + '\n' +
                        t.invalidResponse.note,
                        5000
                    );
                }

                if (resolve.loadType === 'playlist') {
                    isPlaylist = true;
                    for (const track of resolve.tracks) {
                        track.info.requester = interaction.user.username;
                        player.queue.add(track);
                        requesters.set(track.info.uri, interaction.user.username);
                    }
                } else if (resolve.loadType === 'search' || resolve.loadType === 'track') {
                    const track = resolve.tracks.shift();
                    track.info.requester = interaction.user.username;
                    player.queue.add(track);
                    requesters.set(track.info.uri, interaction.user.username);
                } else {
                    return sendErrorResponse(
                        interaction,
                        t.noResults.title + '\n\n' +
                        t.noResults.message + '\n' +
                        t.noResults.note,
                        5000
                    );
                }
            }

            let queuedTracks = 0;

            const maxTracks = 200;
            for (let i = 0; i < Math.min(tracksToQueue.length, maxTracks); i++) {
                const trackQuery = tracksToQueue[i];
                try {
                    const resolve = await client.riffy.resolve({ query: trackQuery, requester: interaction.user.username });
                    if (resolve && resolve.tracks && resolve.tracks.length > 0) {
                        const trackInfo = resolve.tracks[0];
                        player.queue.add(trackInfo);
                        requesters.set(trackInfo.info.uri, interaction.user.username);
                        queuedTracks++;
                    }
                } catch (error) {
                    console.error(`Error resolving track ${trackQuery}:`, error);
                }
            }
            
            if (tracksToQueue.length > maxTracks) {
                console.warn(`Playlist truncated: ${tracksToQueue.length} tracks requested, only ${maxTracks} queued`);
            }

            // A lengthy playlist resolve might outlive the voice session.
            // Do not announce playback on a ghost player.
            if (!(await waitForPlayerConnection(client, player, 3000))) {
                throw new Error('The bot left voice while the requested track was loading.');
            }

            if (!player.playing && !player.paused) {
                await player.play();
            }

            const successTitle = isPlaylist ? t.success.titlePlaylist : t.success.titleTrack;
            const titleIcon = isPlaylist ? (getEmoji('playlist') || '📚') : (getEmoji('music') || '🎵');
            const addedIcon = isPlaylist ? (getEmoji('playlist') || '📚') : (getEmoji('success') || '✅');
            const statusIcon = player.playing ? (getEmoji('play') || '▶️') : (getEmoji('pause') || '⏸️');
            const statusText = stripLeadingIcons(player.playing ? t.success.nowPlaying : t.success.queueReady);
            const successContainer = buildPaleCard(
                `${titleIcon} ${sanitizeTitle(successTitle, 'Play')}`,
                [
                    `### ${addedIcon} Added` + '\n' +
                    (isPlaylist
                        ? t.success.playlistAdded.replace('{count}', queuedTracks)
                        : t.success.trackAdded),
                    `### ${statusIcon} Status` + '\n' +
                    statusText
                ]
            );

            const message = await interaction.editReply({ 
                components: [successContainer],
                flags: MessageFlags.IsComponentsV2,
                fetchReply: true
            });

            setTimeout(() => {
                message.delete().catch(() => {}); 
            }, 3000);

        } catch (error) {
            const lang = await getLang(interaction.guildId).catch(() => ({ music: { play: { errors: {} } } }));
            const t = lang.music?.play?.errors || {};
            
            return handleCommandError(
                interaction,
                error,
                'play',
                (t.title || '## ❌ Error') + '\n\n' + (t.message || 'An error occurred while processing the request.\nPlease try again later.')
            );
        }
    },
    requesters: requesters,
};
