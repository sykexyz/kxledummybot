module.exports = {
	config: {
		name: "haha",
		version: "1.0.0",
		author: "KXLE — BOT",
		countDown: 5,
		role: 2,
		description: {
			en: "Start/stop a looping message that sends words from an uploaded .txt file (one word per line)."
		},
		category: "box chat",
		guide: {
			en: "   {pn} on <sequential|scramble> <speed 1-20> <emoji>: start loop\n"
				+ "   {pn} off: stop loop\n"
				+ "   {pn} status: check loop status\n"
				+ "Note: upload the .txt file first from the website Loop settings."
		}
	},

	langs: {
		en: {
			started: "✅ | Loop message started!\nMode: %1\nSpeed: %2 (20 = slow, 1 = fast)\nAuto react: %3",
			stopped: "✅ | Loop message stopped.",
			alreadyOn: "⚠️ | Loop is already running in this chat.",
			alreadyOff: "⚠️ | Loop is not running in this chat.",
			noWords: "❌ | No words found. Please upload a .txt file with words (one per line) from the website first.",
			invalidMode: "❌ | Invalid mode. Use 'sequential' or 'scramble'.",
			invalidSpeed: "❌ | Speed must be a number between 1 and 20.",
			statusOn: "🔁 | Loop is currently RUNNING in this chat.\nMode: %1\nSpeed: %2\nWords: %3\nAuto react: %4",
			statusOff: "🔁 | Loop is currently STOPPED in this chat."
		}
	},

	onStart: async function ({ args, message, event, getLang, threadsData, threadID, api }) {
		const loopManager = require("../../bot/loop/loopManager.js");
		const session = loopManager.getSession(threadID);

		if (args[0] == "off") {
			if (!session.active)
				return message.reply(getLang("alreadyOff"));
			loopManager.stopLoop(threadID);
			return message.reply(getLang("stopped"));
		}

		if (args[0] == "status") {
			const wordsCount = session.words ? session.words.length : 0;
			if (session.active)
				return message.reply(getLang("statusOn", session.mode, session.speed, wordsCount, session.autoReact ? "ON (" + session.autoReactEmoji + ")" : "OFF"));
			return message.reply(getLang("statusOff"));
		}

		if (args[0] == "on") {
			if (session.active)
				return message.reply(getLang("alreadyOn"));
			if (!session.words || session.words.length == 0)
				return message.reply(getLang("noWords"));

			const mode = args[1] || "sequential";
			if (mode !== "sequential" && mode !== "scramble")
				return message.reply(getLang("invalidMode"));

			const speed = parseInt(args[2]) || 5;
			if (isNaN(speed) || speed < 1 || speed > 20)
				return message.reply(getLang("invalidSpeed"));

			const autoReact = args[3] == "react";
			const emoji = args[4] || "❤️";

			loopManager.startLoop(api, threadID, {
				words: session.words,
				mode,
				speed,
				autoReact,
				autoReactEmoji: emoji
			});
			return message.reply(getLang("started", mode, speed, autoReact ? "ON (" + emoji + ")" : "OFF"));
		}

		return message.SyntaxError();
	}
};
