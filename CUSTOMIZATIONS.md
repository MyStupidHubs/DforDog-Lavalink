# D for Dog customization inventory

This inventory compares the pre-sync fork tip (`backup-pre-sync`, formerly `main`) with `upstream/main` v1.5.1. The histories have no merge base, so the sync is rebuilt from upstream rather than merged. Secret values are intentionally omitted.

## Customizations that must remain

| File | Fork customization | Preservation decision |
| --- | --- | --- |
| `config.js` | Runtime identity and private deployment configuration: existing bot token, owner IDs, MongoDB URI, Spotify credentials, `DJ For Dog` activity, green embed color, support URL, display/performance toggles, error-log setting, and the existing `DJForDog` Lavalink node (including its password and connection values). Default language is English. | Start from the v1.5.1 key layout, preserve every pre-sync value exactly, and add the new v1.5.1 keys with upstream defaults. Never disclose secret values. |
| `player.js` | Updates Discord channel `1474712195127316530` to `DJ for Dog: 🟢` or `DJ for Dog: 🔴` when the Lavalink node connects, errors, or disconnects. | Reapply to the refactored v1.5.1 player without replacing upstream player/UI logic. |
| `player.js` | Riffy voice-channel ID compatibility patch and optional debug/gating logic. | Already present in upstream v1.5.1 with the same behavior; retain upstream's copy rather than stacking another patch. |
| `bot.js`, `lavalink.js` | WebSocket/Lavalink reconnect handling, retry-loop behavior, and handling of the known Riffy reconnect error. | Pre-sync and upstream tip versions are identical, so upstream already contains these fixes. |
| `events/interactionCreate.js`, `commands/music/play.js`, `utils/responseHandler.js` | Earlier fork commits experimented with awaiting language lookup, deferring `/play` sooner, and adding fallback messages. Later fork commits reverted those experiments. | Use upstream v1.5.1, which implements the replacement fix through `safeDeferReply`, `safeDeferUpdate`, guarded acknowledgement errors, and language fallbacks. Do not stack the obsolete fork experiments. |
| `index.js` | Render keep-alive HTTP server. | Pre-sync and upstream versions are identical; retain upstream's file unchanged. |
| `index.html` | Render landing page. The only tip difference is upstream's `Prime Music 1.5` version text replacing `1.4`; the fork did not contain D for Dog branding here. | Use upstream v1.5.1. |
| `utils/musicCard.js`, `utils/statusManager.js` | Hosting/card/status behavior associated with empty fork-authored commits. | Files are identical at both tips; retain upstream unchanged. |
| `package-lock.json` | The pre-sync fork tracks a generated lock even though `.gitignore` ignores it; upstream does not carry one. | Do not merge it. Generate a fresh lock from v1.5.1 `package.json` with `npm install`, then force-add the generated file. |

## New v1.5.1 configuration keys

These keys did not exist in the pre-sync fork and are initialized from upstream. They are not secrets, but should be reviewed after deployment:

- `customEmoji: true`
- `emojiTheme: "redwhite"`
- `helpBannerUrl`: upstream's default banner URL
- `metadataTag: true`

No existing fork configuration value is replaced by an upstream placeholder.

## File-by-file upstream classification

Unless called out as mixed/custom above, these differences are upstream v1.5.1 changes and upstream wins.

| File | Classification |
| --- | --- |
| `.gitignore` | Upstream newer: broader environment-file exclusions. |
| `LICENSE` | Upstream newer: copyright year. |
| `README.md` | Upstream newer: v1.5.1 documentation/version. |
| `UI/emojis/emoji.js` | Upstream new: custom emoji resolver/theme support. |
| `UI/emojis/emojiData.js` | Upstream new: emoji theme data. |
| `commands/basic/help.js` | Upstream newer: Display Components v2 help UI. |
| `commands/basic/ping.js` | Upstream newer: Display Components v2 response. |
| `commands/basic/stats.js` | Upstream newer: Display Components v2 response. |
| `commands/basic/support.js` | Upstream newer: Display Components v2 response. |
| `commands/music/autoplay.js` | Upstream newer: v1.5 response styling. |
| `commands/music/filters.js` | Upstream newer: v1.5 response styling. |
| `commands/music/jump.js` | Upstream newer: v1.5 response styling. |
| `commands/music/move.js` | Upstream newer: v1.5 response styling. |
| `commands/music/np.js` | Upstream newer: refactored now-playing UI. |
| `commands/music/pause.js` | Upstream newer: v1.5 response styling. |
| `commands/music/play.js` | Mixed: upstream autocomplete, safer deferral, connection wait, and Display Components v2 UI supersede reverted fork experiments. |
| `commands/music/queue.js` | Upstream newer: refactored queue UI. |
| `commands/music/remove.js` | Upstream newer: v1.5 response styling. |
| `commands/music/resume.js` | Upstream newer: v1.5 response styling. |
| `commands/music/search.js` | Upstream newer: refactored search UI. |
| `commands/music/seek.js` | Upstream newer: v1.5 response styling. |
| `commands/music/shuffle.js` | Upstream newer: v1.5 response styling. |
| `commands/music/skip.js` | Upstream newer: v1.5 response styling. |
| `commands/music/stop.js` | Upstream newer: v1.5 response styling. |
| `commands/music/trackinfo.js` | Upstream newer: refactored track-information UI. |
| `commands/music/volume.js` | Upstream newer: v1.5 response styling. |
| `commands/music/voteskip.js` | Upstream newer: v1.5 response styling. |
| `commands/playlist/addsong.js` | Upstream replacement: folded into consolidated `playlist.js`. |
| `commands/playlist/allplaylists.js` | Upstream replacement: folded into consolidated `playlist.js`. |
| `commands/playlist/createplaylist.js` | Upstream replacement: folded into consolidated `playlist.js`. |
| `commands/playlist/deleteplaylist.js` | Upstream replacement: folded into consolidated `playlist.js`. |
| `commands/playlist/deletesong.js` | Upstream replacement: folded into consolidated `playlist.js`. |
| `commands/playlist/myplaylists.js` | Upstream replacement: folded into consolidated `playlist.js`. |
| `commands/playlist/playcustomplaylist.js` | Upstream replacement: folded into consolidated `playlist.js`. |
| `commands/playlist/savequeue.js` | Upstream replacement: folded into consolidated `playlist.js`. |
| `commands/playlist/showsongs.js` | Upstream replacement: folded into consolidated `playlist.js`. |
| `commands/playlist/playlist.js` | Upstream new: consolidated modal/button/select-menu playlist UX. |
| `commands/utility/emoji.js` | Upstream new: emoji configuration/preview command. |
| `commands/utility/history.js` | Upstream newer: v1.5 history UI. |
| `commands/utility/language.js` | Upstream newer: refactored language selector UI. |
| `commands/utility/twentyfourseven.js` | Upstream newer: v1.5 response styling. |
| `config.js` | Mixed/custom: preserve all fork values; add four upstream keys. |
| `events/interactionCreate.js` | Upstream newer: safe interaction handling plus new help/playlist component routing. |
| `index.html` | Upstream newer: landing-page version text. |
| `languages/de.js` | Upstream newer: v1.5 UI/playlist strings. |
| `languages/en.js` | Upstream newer: v1.5 UI/playlist strings; configured default remains English. |
| `languages/es.js` | Upstream newer: v1.5 UI/playlist strings. |
| `languages/fr.js` | Upstream newer: v1.5 UI/playlist strings. |
| `languages/ja.js` | Upstream newer: v1.5 UI/playlist strings. |
| `languages/ko.js` | Upstream newer: v1.5 UI/playlist strings. |
| `languages/ru.js` | Upstream newer: v1.5 UI/playlist strings. |
| `musicard.png` | Upstream newer: updated binary card asset. |
| `package-lock.json` | Fork-only generated artifact: regenerate from upstream `package.json`. |
| `player.js` | Mixed/custom: upstream recommendation/player/Display Components refactor wins; restore only the D for Dog status-channel listeners. |
| `utils/playerValidation.js` | Upstream newer: Display Components v2 validation response. |
| `utils/responseHandler.js` | Upstream newer: card builders and safe acknowledgement helpers supersede old fork timeout experiments. |
| `utils/voiceChannelCheck.js` | Upstream newer: Display Components v2 voice validation response. |

## Authorship audit

The pre-sync history has 58 commits: 24 authored with the MyStupidHubs GitHub noreply identity and 34 authored by GlaceYT. Of the 24 fork-authored commits, 16 contain file changes and 8 are empty commits. The content-bearing commits affect only `config.js`, `player.js`, `commands/music/play.js`, and `events/interactionCreate.js`. Final-state decisions for all four files are documented above.
