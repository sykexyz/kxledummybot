/**
 * @author KXLE — BOT
 * ! Maintained by KXLE — BOT.
 * Thank you for using
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");

function startBot() {
	const child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	child.on("close", (code) => {
		log.info("RESTART", `Goat.js exited with code ${code}, restarting...`);
		startBot();
	});

	child.on("error", (err) => {
		log.err("RESTART", `Failed to spawn Goat.js: ${err.message}`);
		setTimeout(startBot, 5000);
	});
}

startBot();
