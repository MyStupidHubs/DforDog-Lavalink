console.log(`[ BOOT ] DforDog Riffy websocket-recovery v9 loaded | commit=${process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown'}`);
require("./utils/riffyVoiceLifecycleFix.js");
require("./utils/riffyWsHeartbeatRecovery.js");
require("./utils/riffyRestEventFallback.js");
require("./utils/riffyTrackStartPanelRecovery.js");
require("./bot.js");
