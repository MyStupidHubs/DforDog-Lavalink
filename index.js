console.log(`[ BOOT ] DforDog Riffy voice-state recovery v11 loaded | commit=${process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown'}`);
require("./utils/riffyVoiceLifecycleFix.js");
require("./utils/riffyWsHeartbeatRecovery.js");
require("./utils/riffyIntentionalStopGuard.js");
require("./utils/riffyVoiceJoinStateFix.js");
require("./utils/riffyRestEventFallback.js");
require("./utils/riffyTrackStartPanelRecovery.js");
require("./bot.js");
