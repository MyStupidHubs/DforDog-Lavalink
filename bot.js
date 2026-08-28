const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.js");
const fs = require("fs");
const path = require('path');
const { initializePlayer } = require('./player');
const { connectToDatabase } = require('./mongodb');
const colors = require('./UI/colors/colors');
const { getLavalinkManager } = require('./lavalink.js');
const { getLang, getLangSync } = require('./utils/languageLoader.js');
require('dotenv').config();

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => {
        return GatewayIntentBits[a];
    }),
});

client.config = config;


process.on('unhandledRejection', (error) => {
    const lang = getLangSync();
    if (error && error.message && (
        error.message.includes('Cannot read properties of null') ||
        error.message.includes('track.info') ||
        error.message.includes('thumbnail') ||
        error.message.includes('player.restart is not a function') ||
        error.message.includes('restart is not a function')
    )) {
   
        if (error.message.includes('player.restart') || error.message.includes('restart is not a function')) {
            console.warn(`${colors.cyan}[ LAVALINK ]${colors.reset} ${colors.yellow}Ignoring Riffy reconnect bug: ${error.message}${colors.reset}`);
        }
        return;
    }
    
    // timeout errors
    if (error && (error.cause || error.message)) {
        const cause = error.cause || {};
        const errorMsg = error.message || '';
        
        if (cause.code === 'UND_ERR_CONNECT_TIMEOUT' || 
            errorMsg.includes('Connect Timeout') ||
            errorMsg.includes('fetch failed') ||
            errorMsg.includes('ConnectTimeoutError')) {
            console.warn(`${colors.cyan}[ LAVALINK ]${colors.reset} ${colors.yellow}Connection timeout to Lavalink node - will retry automatically${colors.reset}`);
            return; 
        }
    }
    
    console.error(lang.console?.bot?.unhandledRejection || 'Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    const lang = getLangSync();
    if (error && error.message && (
        error.message.includes('Cannot read properties of null') ||
        error.message.includes('track.info') ||
        error.message.includes('thumbnail')
    )) {
        console.warn(lang.console?.bot?.riffyThumbnailError?.replace('{message}', error.message) || `[ Riffy ] Ignoring thumbnail error: ${error.message}`);
        return;
    }
    console.error(lang.console?.bot?.uncaughtException || 'Uncaught Exception:', error);
});

function installStalePlayerEventGuard(client) {
    const riffy = client.riffy;
    if (!riffy || riffy.__stalePlayerEventGuardInstalled) return;

    const originalEmit = riffy.emit;
    const pendingQueueEnds = new Map();
    const lifecycleEvents = new Set(['trackStart', 'trackEnd', 'queueEnd', 'playerDisconnect', 'trackError', 'trackStuck']);

    riffy.emit = function(eventName, ...args) {
        const eventPlayer = args[0];
        const guildId = eventPlayer?.guildId;
        const track = args[1];

        if (lifecycleEvents.has(eventName) && guildId) {
            const title = track?.info?.title || eventPlayer?.current?.info?.title || 'none';
            console.log(`${colors.cyan}[ RIFFY EVENT ]${colors.reset} ${eventName} guild=${guildId} playing=${eventPlayer?.playing === true} queue=${eventPlayer?.queue?.length ?? 'n/a'} current=${title}`);
        }

        if (eventName === 'trackStart' && guildId) {
            const pending = pendingQueueEnds.get(guildId);
            if (pending) {
                clearTimeout(pending.timer);
                pendingQueueEnds.delete(guildId);
                console.warn(`${colors.cyan}[ RIFFY ]${colors.reset} ${colors.yellow}Cancelled stale queueEnd cleanup for guild ${guildId}; playback resumed with ${track?.info?.title || 'a new track'}.${colors.reset}`);
            }
        }

        if (eventName === 'queueEnd' && guildId) {
            const previousPending = pendingQueueEnds.get(guildId);
            if (previousPending) {
                clearTimeout(previousPending.timer);
            }

            const timer = setTimeout(() => {
                pendingQueueEnds.delete(guildId);

                const currentPlayer = this.players?.get(guildId);
                const replacementPlayer = currentPlayer && currentPlayer !== eventPlayer && !currentPlayer.destroyed;
                const samePlayerResumed = currentPlayer === eventPlayer && eventPlayer?.playing === true;

                if (replacementPlayer || samePlayerResumed) {
                    console.warn(`${colors.cyan}[ RIFFY ]${colors.reset} ${colors.yellow}Ignoring stale queueEnd for guild ${guildId}; a player is already active again.${colors.reset}`);
                    return;
                }

                console.log(`${colors.cyan}[ RIFFY ]${colors.reset} Dispatching confirmed queueEnd for guild ${guildId}.`);
                originalEmit.call(this, eventName, ...args);
            }, 1200);

            pendingQueueEnds.set(guildId, { timer, player: eventPlayer });
            return true;
        }

        if (eventName === 'playerDisconnect' && guildId) {
            setTimeout(() => {
                const currentPlayer = this.players?.get(guildId);
                const hasReplacementPlayer = currentPlayer && currentPlayer !== eventPlayer && !currentPlayer.destroyed;

                if (hasReplacementPlayer) {
                    console.warn(`${colors.cyan}[ RIFFY ]${colors.reset} ${colors.yellow}Ignoring delayed playerDisconnect for guild ${guildId}; a newer player is active.${colors.reset}`);
                    return;
                }

                originalEmit.call(this, eventName, ...args);
            }, 500);
            return true;
        }

        return originalEmit.call(this, eventName, ...args);
    };

    riffy.__stalePlayerEventGuardInstalled = true;
    console.log(`${colors.cyan}[ RIFFY ]${colors.reset} Lifecycle guard v2 installed (queueEnd debounce + delayed disconnect).`);
}

initializePlayer(client).then(() => {
    installStalePlayerEventGuard(client);
}).catch(error => {
    const lang = getLangSync();
    console.error(`${colors.cyan}[ LAVALINK ]${colors.reset} ${colors.red}${lang.console?.bot?.lavalinkError?.replace('{message}', error.message) || `Error initializing player: ${error.message}`}${colors.reset}`);
});

client.on("clientReady", () => {
    const lang = getLangSync();
    console.log(`${colors.cyan}[ SYSTEM ]${colors.reset} ${colors.green}${lang.console?.bot?.clientLogged?.replace('{tag}', client.user.tag) || `Client logged as ${client.user.tag}`}${colors.reset}`);
    console.log(`${colors.cyan}[ MUSIC ]${colors.reset} ${colors.green}${lang.console?.bot?.musicSystemReady || 'Riffy Music System Ready 🎵'}${colors.reset}`);
   
    const nodeManager = getLavalinkManager();
    if (nodeManager) {
        nodeManager.init(client.user.id);
        
        setTimeout(() => {
            const status = nodeManager.getNodeStatus();
            const availableCount = nodeManager.getNodeCount();
            const totalCount = nodeManager.getTotalNodeCount();
            
            console.log(`${colors.cyan}[ LAVALINK ]${colors.reset} ${colors.green}${lang.console?.bot?.nodeManagerStatus?.replace('{available}', availableCount).replace('{total}', totalCount) || `Node Manager: ${availableCount}/${totalCount} nodes available`}${colors.reset}`);
            
            if (status.nodes.length > 0) {
                console.log(`${colors.cyan}[ LAVALINK ]${colors.reset} ${lang.console?.bot?.nodeStatus || 'Node Status:'}`);
                for (const node of status.nodes) {
                    const statusIcon = node.online ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
                    const statusText = node.online ? 'ONLINE' : 'OFFLINE';
                    const errorText = node.lastError ? ` | ${colors.yellow}${node.lastError}${colors.reset}` : '';
                    const nodeInfo = lang.console?.bot?.nodeInfo?.replace('{icon}', statusIcon).replace('{name}', node.name).replace('{host}', node.host).replace('{port}', node.port).replace('{status}', statusText).replace('{error}', errorText) || `  ${statusIcon} ${colors.yellow}${node.name}${colors.reset} (${node.host}:${node.port}) - ${statusText}${errorText}`;
                    console.log(nodeInfo);
                }
            }
        }, 3000);
    } else if (client.riffy) {
    client.riffy.init(client.user.id);
    }
});
client.config = config;

fs.readdir("./events", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0]; 
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
  });
});



client.commands = new Map();
client.commandsArray = [];


const loadCommands = () => {
  const loadCommandsFromDir = (dir, category = '') => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
    
        loadCommandsFromDir(fullPath, item.name);
      } else if (item.isFile() && item.name.endsWith('.js')) {
        try {
       
          const absolutePath = path.resolve(fullPath);
          const command = require(absolutePath);
          
          if (command.data && command.run) {
            client.commands.set(command.data.name, command);
            client.commandsArray.push(command.data.toJSON());
            const categoryInfo = category ? ` [${category}]` : '';
            //console.log(`${colors.cyan}[ COMMANDS ]${colors.reset} ${colors.green}Loaded: ${colors.yellow}${command.data.name}${categoryInfo}${colors.reset}`);
          } else {
            const lang = getLangSync();
            console.log(`${colors.cyan}[ COMMANDS ]${colors.reset} ${colors.red}${lang.console?.bot?.commandLoadFailed?.replace('{name}', item.name) || `Failed to load: ${item.name} - Missing data or run property`}${colors.reset}`);
      }
        } catch (error) {
          const lang = getLangSync();
          console.error(`${colors.cyan}[ COMMANDS ]${colors.reset} ${colors.red}${lang.console?.bot?.commandLoadError?.replace('{name}', item.name).replace('{message}', error.message) || `Error loading ${item.name}: ${error.message}`}${colors.reset}`);
    }
      }
    }
  };
  

  const commandsDir = path.resolve(__dirname, config.commandsDir);
  loadCommandsFromDir(commandsDir);
  const lang = getLangSync();
  console.log(`${colors.cyan}[ COMMANDS ]${colors.reset} ${colors.green}${lang.console?.bot?.commandsLoaded?.replace('{count}', client.commands.size) || `Total Commands Loaded: ${client.commands.size}`}${colors.reset}`);
};

loadCommands();


client.on("raw", (d) => {
    const { GatewayDispatchEvents } = require("discord.js");
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    if (config.voiceDebug === true) {
        if (d.t === GatewayDispatchEvents.VoiceStateUpdate) {
            const isBot = d.d?.user_id === client.user?.id;
            console.log(`[ VOICE DEBUG ] raw=${d.t} guild=${d.d?.guild_id || 'null'} botUser=${isBot} channel=${d.d?.channel_id || 'null'} sessionId=${d.d?.session_id ? 'yes' : 'no'}`);
        } else {
            console.log(`[ VOICE DEBUG ] raw=${d.t} guild=${d.d?.guild_id || 'null'} endpoint=${d.d?.endpoint ? 'yes' : 'no'} token=${d.d?.token ? 'yes' : 'no'}`);
        }
    }
    client.riffy.updateVoiceState(d);
});

client.login(config.TOKEN || process.env.TOKEN).catch((e) => {
  const lang = getLangSync();
  console.log('\n' + '─'.repeat(40));
  console.log(`${colors.magenta}${colors.bright}${lang.console?.bot?.tokenVerification || '🔐 TOKEN VERIFICATION'}${colors.reset}`);
  console.log('─'.repeat(40));
  console.log(`${colors.cyan}[ TOKEN ]${colors.reset} ${colors.red}${lang.console?.bot?.tokenAuthFailed || 'Authentication Failed ❌'}${colors.reset}`);
  console.log(`${colors.gray}${lang.console?.bot?.tokenError || 'Error: Turn On Intents or Reset New Token'}${colors.reset}`);
});
connectToDatabase().then(() => {
  const lang = getLangSync();
  console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.green}${lang.console?.bot?.databaseOnline || 'MongoDB Online ✅'}${colors.reset}`);
}).catch((err) => {
  const lang = getLangSync();
  console.log('\n' + '─'.repeat(40));
  console.log(`${colors.magenta}${colors.bright}${lang.console?.bot?.databaseStatus || '🕸️  DATABASE STATUS'}${colors.reset}`);
  console.log('─'.repeat(40));
  console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.red}${lang.console?.bot?.databaseFailed || 'Connection Failed ❌'}${colors.reset}`);
  console.log(`${colors.gray}${lang.console?.bot?.databaseError?.replace('{message}', err.message) || `Error: ${err.message}`}${colors.reset}`);
});
const express = require("express");
const app = express();
const port = 3000;
app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'index.html');
    res.sendFile(imagePath);
});

app.listen(port, () => {
    console.log('\n' + '─'.repeat(40));
    console.log(`${colors.magenta}${colors.bright}🌐 SERVER STATUS${colors.reset}`);
    console.log('─'.repeat(40));
    console.log(`${colors.cyan}[ SERVER ]${colors.reset} ${colors.green}Online ✅${colors.reset}`);
    console.log(`${colors.cyan}[ PORT ]${colors.reset} ${colors.yellow}http://localhost:${port}${colors.reset}`);
    console.log(`${colors.cyan}[ TIME ]${colors.reset} ${colors.gray}${new Date().toISOString().replace('T', ' ').split('.')[0]}${colors.reset}`);
    console.log(`${colors.cyan}[ USER ]${colors.reset} ${colors.yellow}GlaceYT${colors.reset}`);
});
