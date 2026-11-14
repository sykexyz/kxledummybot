module.exports = {
	config: {
		name: "luhka",
		version: "1.0.0",
		author: "KXLE — BOT",
		countDown: 5,
		role: 2,
		description: {
			en: "Start/stop the auto responder that replies to incoming chat messages with words from an uploaded .txt file."
		},
		category: "box chat",
		guide: {
			en: "   {pn} on <sequential|scramble> <emoji>: start auto responder\n"
				+ "   {pn} off: stop auto responder\n"
				+ "   {pn} status: check status\n"
				+ "Note: upload the .txt file first from the website Auto Responder settings."
		}
	},

	langs: {
		en: {
			started: "✅ | Auto responder started!\nMode: %1\nAuto react: %2",
			stopped: "✅ | Auto responder stopped.",
			alreadyOn: "⚠️ | Auto responder is already running in this chat.",
			alreadyOff: "⚠️ | Auto responder is not running in this chat.",
			noWords: "❌ | No words found. Please upload a .txt file with words (one per line) from the website first.",
			invalidMode: "❌ | Invalid mode. Use 'sequential' or 'scramble'.",
			statusOn: "🤖 | Auto responder is currently RUNNING in this chat.\nMode: %1\nWords: %2\nAuto react: %3",
			statusOff: "🤖 | Auto responder is currently STOPPED in this chat."
		}
	},

	onStart: async function ({ args, message, event, getLang, threadID }) {
		const autoResponder = require("../../bot/autoResponder/autoResponderManager.js");
		const session = autoResponder.getSession(threadID);

		if (args[0] == "off") {
			if (!session.active)
				return message.reply(getLang("alreadyOff"));
			autoResponder.stop(threadID);
			return message.reply(getLang("stopped"));
		}

		if (args[0] == "status") {
			const wordsCount = session.words ? session.words.length : 0;
			if (session.active)
				return message.reply(getLang("statusOn", session.mode, wordsCount, session.autoReact ? "ON (" + session.autoReactEmoji + ")" : "OFF"));
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

			const autoReact = args[2] == "react";
			const emoji = args[3] || "❤️";

			autoResponder.start(threadID, {
				words: session.words,
				mode,
				autoReact,
				autoReactEmoji: emoji
			});
			return message.reply(getLang("started", mode, autoReact ? "ON (" + emoji + ")" : "OFF"));
		}

		return message.SyntaxError();
	}
};
