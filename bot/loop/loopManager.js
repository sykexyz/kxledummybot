const fs = require("fs-extra");

/**
 * Loop message manager.
 * Stores per-thread loop sessions in memory and sends messages via the API.
 *
 * Session shape:
 * {
 *   active: boolean,
 *   words: string[],          // parsed from uploaded txt (one word per line)
 *   mode: "sequential" | "scramble",
 *   speed: number,            // 1 (fast) .. 20 (slow) -> interval = speed * 1000 ms
 *   index: number,            // current position for sequential mode
 *   autoReact: boolean,
 *   autoReactEmoji: string,   // emoji to react after sending
 *   interval: null            // setInterval handle
 * }
 */

const sessions = new Map(); // threadID -> session

function getSession(threadID) {
	if (!sessions.has(threadID))
		sessions.set(threadID, {
			active: false,
			words: [],
			mode: "sequential",
			speed: 5,
			index: 0,
			autoReact: false,
			autoReactEmoji: "❤️",
			interval: null
		});
	return sessions.get(threadID);
}

function parseWords(fileContent) {
	return String(fileContent)
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(line => line.length > 0);
}

function pickWord(session) {
	const { words, mode, index } = session;
	if (!words || words.length == 0)
		return null;
	if (mode === "scramble")
		return words[Math.floor(Math.random() * words.length)];
	const word = words[index % words.length];
	session.index = (index + 1) % words.length;
	return word;
}

/**
 * Start the loop for a thread.
 * @param {Object} api - the facebook chat api instance (needs sendMessage, sendReaction)
 * @param {string} threadID
 * @param {Object} opts
 */
function startLoop(api, threadID, { words, mode, speed, autoReact, autoReactEmoji }) {
	const session = getSession(threadID);
	if (session.interval) clearInterval(session.interval);

	session.words = words;
	session.mode = mode || "sequential";
	session.speed = Math.min(20, Math.max(1, parseInt(speed) || 5));
	session.autoReact = autoReact === true;
	session.autoReactEmoji = autoReactEmoji || "❤️";
	session.active = true;
	session.index = session.index || 0;

	const intervalMs = session.speed * 1000;

	session.interval = setInterval(async () => {
		if (!session.active) return;
		const word = pickWord(session);
		if (!word) return;
		try {
			await api.sendMessage(word, threadID);
			if (session.autoReact && session.autoReactEmoji) {
				try {
					await api.sendReaction(session.autoReactEmoji, threadID);
				}
				catch (e) { /* reaction failed, ignore */ }
			}
		}
		catch (e) {
			// send failed; keep loop running
		}
	}, intervalMs);

	return session;
}

function stopLoop(threadID) {
	const session = getSession(threadID);
	session.active = false;
	if (session.interval) {
		clearInterval(session.interval);
		session.interval = null;
	}
	return session;
}

function getAllSessions() {
	return sessions;
}

module.exports = {
	sessions,
	getSession,
	parseWords,
	startLoop,
	stopLoop,
	pickWord,
	getAllSessions
};
