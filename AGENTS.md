# Goat Bot V2 — KXLE — BOT (custom build)

## How to run
- `npm run dev` (starts bot + Express dashboard on port 3001)
- Requires Facebook account credentials in `account.txt` and native `canvas` build; this sandbox cannot compile `canvas` or log in, so a live preview could not be started here. All JS/ETA files pass `node -c` syntax checks and `config.json`/`package.json` are valid JSON.

## New features
- `batakoto <add|remove|list|clear> <id>` — whitelist management (bot owner only). Only the owner + whitelisted IDs can control the bot; empty whitelist = owner only. Enforced in `bot/handler/handlerEvents.js` (onStart).
- `haha` — loop message (`bot/loop/loopManager.js`, `scripts/cmds/loop.js`). Web: upload `.txt` (one word/line), mode sequential/scramble, speed 1(fast)–20(slow), auto-react emoji.
- `luhka` — auto responder (`bot/autoResponder/autoResponderManager.js`, `scripts/cmds/autoreply.js`). Replies to real-time chat with txt words. Same web config + auto-react.
- Feedback toggle — `config.feedbackMode.enable`; when off, skips "downloading/processing" status replies (gated in `scripts/cmds/ytb.js` via `utils.isFeedbackEnabled()`).

## Branding
- All NTKhang credits replaced with "KXLE — BOT" (Goat.js, index.js, package.json, footer, header, nav, 73 command files).
- Dashboard: dark hacker theme, Matrix falling black/white letters canvas background, all English, brand "KXLE — BOT".

## Key files
- `bot/loop/loopManager.js`, `bot/autoResponder/autoResponderManager.js` — session managers
- `scripts/cmds/batakoto.js`, `scripts/cmds/loop.js`, `scripts/cmds/autoreply.js` — commands
- `bot/handler/handlerEvents.js` — whitelist enforcement + auto responder onChat
- `dashboard/routes/api.js` — whitelist/feedback/loop/autoresponder endpoints
- `dashboard/views/settings.eta`, `dashboard-thread.eta`, `partials/header.eta`, `partials/nav.eta`, `partials/footer.eta` — UI
- `dashboard/css/custom.css` — dark theme + matrix canvas
