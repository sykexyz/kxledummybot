/**
 * @author KXLE — BOT
 * ! Maintained by KXLE — BOT.
 * Thank you for using
 */

const fs = require("fs-extra");
const path = require("path");
const { spawn } = require("child_process");
const log = require("./logger/log.js");

// Load config so the dashboard can start without Facebook login
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));

// Set up minimal globals required by dashboard/app.js
global.GoatBot = { config };
global.db = {};
global.utils = require("./utils.js");

// Start the Express dashboard immediately on process.env.PORT (Railway requires this)
const PORT = process.env.PORT || config.dashBoard?.port || config.serverUptime?.port || 3001;

const startDashboard = async () => {
	try {
		const dashboard = require("./dashboard/app.js");
		await dashboard(null);
		log.info("DASHBOARD", `Dashboard is running on port ${PORT}`);
	}
	catch (err) {
		log.err("DASHBOARD", `Failed to start dashboard: ${err.message}`);
	}
};

startDashboard();

// Spawn Goat.js as a background child process for bot functionality
function startBot() {
	const child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	child.on("close", (code) => {
		log.info("RESTART", `Goat.js exited with code ${code}, restarting in 5s...`);
		setTimeout(startBot, 5000);
	});

	child.on("error", (err) => {
		log.err("RESTART", `Failed to spawn Goat.js: ${err.message}`);
		setTimeout(startBot, 5000);
	});
}

startBot();
