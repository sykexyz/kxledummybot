# Plan: Kyle Gaspari Bot — Whitelist, Loop, Auto Responder & Dashboard Redesign

## What we're building
1. **Whitelist ("batakoto <id>")** — Only you (bot owner) and whitelisted IDs can control the bot. If the whitelist is empty, only your own account works. Others are ignored.
2. **Loop message ("haha")** — Starts/stops a per-thread loop that sends words from an uploaded `.txt` (one word per line). Web config: sequential (next-to-next) or scramble (random) mode, speed slider 1–20 (20 = slow, 1 = fast), optional auto-reaction emoji.
3. **Auto responder ("luhka")** — Real-time auto-reply to incoming messages in a thread using words from an uploaded `.txt`. Same web config options + auto-reaction emoji.
4. **Feedback toggle** — Global on/off switch. When off, the bot skips "downloading/processing..." status replies and sends only the final result (applies to all features, not just downloader).
5. **Credits** — All NTKhang credits removed, replaced with "Kyle Gaspari — Developer".
6. **Website redesign** — Dark hacker theme, Matrix-style falling Japanese black/white letters background (canvas, smooth, non-laggy), brand "KYLE GASPARI BOT — DEVELOPER" in the menu, all copy in English, minimal subtitles, casual & readable.
7. **Languages** — All English; remove Indonesian/Vietnamese files; add language keys for new features.

## Files to create
- `scripts/cmds/batakoto.js` — whitelist add/remove/list command (bot admin only)
- `scripts/cmds/loop.js` — `haha` command: start/stop loop
- `bot/loop/loopManager.js` — in-memory loop session manager (intervals, modes, speed, auto-react)
- `scripts/cmds/autoreply.js` — `luhka` command: start/stop auto responder
- `bot/autoResponder/autoResponderManager.js` — onChat auto-reply handler
- `dashboard/views/settings.eta` — global settings page (feedback toggle + whitelist overview)

## Files to modify
- `config.json` — add `feedbackMode`, English language notes, keep `whiteListMode`
- `bot/handler/handlerEvents.js` — enforce whitelist in `onStart`
- `Goat.js`, `index.js` — strip credits, set author "Kyle Gaspari — Developer"
- `package.json` — author field
- `dashboard/app.js` — register `/dashboard/settings` route + new API endpoints
- `dashboard/routes/api.js` — endpoints: upload words txt, set loop/autoresponder config, toggle feedback, whitelist CRUD
- `dashboard/routes/dashBoard.js` — add settings route
- `dashboard/views/partials/header.eta` — `lang="en"`, new brand name, Matrix background canvas
- `dashboard/views/partials/nav.eta` — all-English, new brand name
- `dashboard/views/dashboard.eta`, `dashboard-thread.eta`, `partials/message.eta`, `partials/footer.eta` — translate to English; add Loop + Auto Responder cards to thread page
- `dashboard/css/custom.css` — dark hacker theme
- `languages/en.lang`, `languages/cmds/en.js`, `languages/events/en.js` — English keys for new features
- Remove `languages/vi.lang`

## How to verify
- `npm install` (ensure modules), start dev server, `check_preview` on dashboard pages to confirm no JS errors / blank screens.

Please approve or adjust this plan before I start building.