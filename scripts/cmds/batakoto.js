module.exports = {
	config: {
		name: "batakoto",
		version: "1.0.0",
		author: "KXLE — BOT",
		countDown: 5,
		role: 2,
		description: {
			en: "Manage the whitelist. Only whitelisted IDs (and the bot owner) can control the bot."
		},
		category: "box chat",
		guide: {
			en: "   {pn} add <id>: give someone permission to control the bot\n"
				+ "   {pn} remove <id>: remove permission\n"
				+ "   {pn} list: show all whitelisted IDs\n"
				+ "   {pn} clear: clear the whitelist"
		}
	},

	langs: {
		en: {
			onlyOwner: "🔒 | %1",
			added: "✅ | Added %1 to the whitelist. They can now control the bot.",
			removed: "✅ | Removed %1 from the whitelist.",
			notFound: "❌ | ID %1 is not in the whitelist.",
			already: "⚠️ | ID %1 is already in the whitelist.",
			list: "📋 | Whitelisted IDs:\n%1\n\nNote: the bot owner always has permission even if the whitelist is empty.",
			empty: "📋 | The whitelist is empty. Only the bot owner can control the bot.",
			cleared: "✅ | Whitelist cleared. Only the bot owner can control the bot.",
			invalidId: "❌ | Please provide a valid ID."
		}
	},

	onStart: async function ({ args, message, event, getLang, usersData }) {
		const { senderID } = event;
		const config = global.GoatBot.config;
		if (!config.whiteListMode)
			config.whiteListMode = { enable: false, whiteListIds: [] };
		let whiteListIds = config.whiteListMode.whiteListIds || [];

		const isOwner = config.adminBot && config.adminBot.includes(senderID);

		if (args[0] == "add") {
			if (!isOwner)
				return message.reply(getLang("onlyOwner", "Only the bot owner can add people to the whitelist."));
			const id = args[1];
			if (!id)
				return message.reply(getLang("invalidId"));
			const idStr = String(id);
			if (whiteListIds.includes(idStr))
				return message.reply(getLang("already", idStr));
			whiteListIds.push(idStr);
			config.whiteListMode.whiteListIds = whiteListIds;
			await saveConfig();
			return message.reply(getLang("added", idStr));
		}

		if (args[0] == "remove") {
			if (!isOwner)
				return message.reply(getLang("onlyOwner", "Only the bot owner can remove people from the whitelist."));
			const id = args[1];
			if (!id)
				return message.reply(getLang("invalidId"));
			const idStr = String(id);
			if (!whiteListIds.includes(idStr))
				return message.reply(getLang("notFound", idStr));
			whiteListIds = whiteListIds.filter(x => x !== idStr);
			config.whiteListMode.whiteListIds = whiteListIds;
			await saveConfig();
			return message.reply(getLang("removed", idStr));
		}

		if (args[0] == "list") {
			if (whiteListIds.length == 0)
				return message.reply(getLang("empty"));
			return message.reply(getLang("list", whiteListIds.join("\n")));
		}

		if (args[0] == "clear") {
			if (!isOwner)
				return message.reply(getLang("onlyOwner", "Only the bot owner can clear the whitelist."));
			config.whiteListMode.whiteListIds = [];
			await saveConfig();
			return message.reply(getLang("cleared"));
		}

		return message.SyntaxError();
	}
};

async function saveConfig() {
	const fs = require("fs-extra");
	const path = require("path");
	const dirConfig = path.normalize(`${process.cwd()}/config.json`);
	await fs.writeJson(dirConfig, global.GoatBot.config, { spaces: 2 });
}
