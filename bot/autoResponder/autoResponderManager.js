const fs = require("fs-extra");

/**
 * Auto responder manager.
 * Replies to incoming real-time chat messages in a thread using words from a txt file.
 * Session shape:
 * {
 *   active: boolean,
 *   words: string[],
 *   mode: "sequential" | "scramble",
 *   index: number,
 *   autoReact: boolean,
 *   autoReactEmoji: string
 * }
 */

const sessions = new Map(); // threadID -> session

function getSession(threadID) {
	if (!sessions.has(threadID))
		sessions.set(threadID, {
			active: false,
			words: [],
			mode: "sequential",
			index: 0,
			autoReact: false,
			autoReactEmoji: "❤️"
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

function start(threadID, { words, mode, autoReact, autoReactEmoji }) {
	const session = getSession(threadID);
	session.words = words;
	session.mode = mode || "sequential";
	session.autoReact = autoReact === true;
	session.autoReactEmoji = autoReactEmoji || "❤️";
	session.active = true;
	session.index = session.index || 0;
	return session;
}

function stop(threadID) {
	const session = getSession(threadID);
	session.active = false;
	return session;
}

function getAllSessions() {
	return sessions;
}

module.exports = {
	sessions,
	getSession,
	parseWords,
	start,
	stop,
	pickWord,
	getAllSessions
};
