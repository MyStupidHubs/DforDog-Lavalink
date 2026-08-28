console.log(`[ BOOT ] DforDog Riffy websocket-recovery v5 loaded | commit=${process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown'}`);
require("./utils/riffyVoiceLifecycleFix.js");
require("./bot.js");
