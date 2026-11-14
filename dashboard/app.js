const express = require("express");
const app = express();
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const fs = require("fs-extra");
const session = require("express-session");
const eta = require("eta");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const Passport = require("passport");
const bcrypt = require("bcrypt");
const axios = require("axios");
const mimeDB = require("mime-db");
const http = require("http");
const server = http.createServer(app);
const log = require("../logger/log.js");

const imageExt = ["png", "gif", "webp", "jpeg", "jpg"];
const videoExt = ["webm", "mkv", "flv", "vob", "ogv", "ogg", "rrc", "gifv",
	"mng", "mov", "avi", "qt", "wmv", "yuv", "rm", "asf", "amv", "mp4",
	"m4p", "m4v", "mpg", "mp2", "mpeg", "mpe", "mpv", "m4v", "svi", "3gp",
	"3g2", "mxf", "roq", "nsv", "flv", "f4v", "f4p", "f4a", "f4b", "mod"
];
const audioExt = ["3gp", "aa", "aac", "aax", "act", "aiff", "alac", "amr",
	"ape", "au", "awb", "dss", "dvf", "flac", "gsm", "iklax", "ivs",
	"m4a", "m4b", "m4p", "mmf", "mp3", "mpc", "msv", "nmf",
	"ogg", "oga", "mogg", "opus", "ra", "rm", "raw", "rf64", "sln", "tta",
	"voc", "vox", "wav", "wma", "wv", "webm", "8svx", "cd"
];

function randomStringApikey(max) {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < max; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

function randomNumberApikey(maxLength) {
	let text = "";
	const possible = "0123456789";
	for (let i = 0; i < maxLength; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

function validateEmail(email) {
	const re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

function convertSize(byte) {
	return byte > 1024 ? byte > 1024 * 1024 ? (byte / 1024 / 1024).toFixed(2) + " MB" : (byte / 1024).toFixed(2) + " KB" : byte + " Byte";
}

module.exports = async (api) => {
	let utils = global.utils || require("../utils.js");
	let config = global.GoatBot ? global.GoatBot.config : {};
	let drive = (global.utils && global.utils.drive) || null;
	let threadsData = null;
	let usersData = null;
	let dashBoardData = null;
	let expireVerifyCode = 3600;
	let gRecaptcha = { siteKey: "", secretKey: "" };
	let gmailAccount = { email: "", clientId: "", clientSecret: "", refreshToken: "" };
	let transporter = null;

	// ——— Setup: wrap everything in try/catch so the server ALWAYS starts ———
	try {
		if (!api) {
			const dbResult = await require("./connectDB.js")();
			global.db.threadModel = dbResult.threadModel;
			global.db.userModel = dbResult.userModel;
			global.db.dashBoardModel = dbResult.dashBoardModel;
			global.db.globalModel = dbResult.globalModel;
			global.db.threadsData = dbResult.threadsData;
			global.db.usersData = dbResult.usersData;
			global.db.dashBoardData = dbResult.dashBoardData;
			global.db.globalData = dbResult.globalData;
		}

		utils = global.utils || require("../utils.js");
		config = global.GoatBot ? global.GoatBot.config : {};
		drive = (global.utils && global.utils.drive) || null;

		const { threadModel, userModel, dashBoardModel, threadsData: td, usersData: ud, dashBoardData: dbd } = global.db;
		threadsData = td;
		usersData = ud;
		dashBoardData = dbd;

		if (config.dashBoard)
			expireVerifyCode = config.dashBoard.expireVerifyCode || 3600;
		if (config.credentials) {
			gRecaptcha = config.credentials.gRecaptcha || { siteKey: "", secretKey: "" };
			gmailAccount = config.credentials.gmailAccount || { email: "", clientId: "", clientSecret: "", refreshToken: "" };
		}

		const getText = global.utils.getText || ((key, ...args) => key);

		const { email, clientId, clientSecret, refreshToken } = gmailAccount;

		const OAuth2 = google.auth.OAuth2;
		const OAuth2_client = new OAuth2(clientId, clientSecret);
		OAuth2_client.setCredentials({ refresh_token: refreshToken });
		let accessToken;
		try {
			accessToken = await OAuth2_client.getAccessToken();
		}
		catch (err) {
			log.warn("GMAIL", `Gmail OAuth2 failed: ${err.message}. Email features disabled.`);
		}

		transporter = nodemailer.createTransport({
			host: "smtp.gmail.com",
			service: "Gmail",
			auth: {
				type: "OAuth2",
				user: email,
				clientId,
				clientSecret,
				refreshToken,
				accessToken
			}
		});

		eta.configure({ useWith: true });

		app.set("views", `${__dirname}/views`);
		app.engine("eta", eta.renderFile);
		app.set("view engine", "eta");

		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(cookieParser());
		app.use(session({
			secret: randomStringApikey(10),
			resave: false,
			saveUninitialized: true,
			cookie: {
				secure: false,
				httpOnly: true,
				maxAge: 1000 * 60 * 60 * 24 * 7
			}
		}));

		app.use("/css", express.static(`${__dirname}/css`));
		app.use("/js", express.static(`${__dirname}/js`));
		app.use("/images", express.static(`${__dirname}/images`));

		require("./passport-config.js")(Passport, dashBoardData, bcrypt);
		app.use(Passport.initialize());
		app.use(Passport.session());
		app.use(fileUpload());
		app.use(flash());

		app.use(function (req, res, next) {
			res.locals.gRecaptcha_siteKey = gRecaptcha.siteKey;
			res.locals.__dirname = __dirname;
			res.locals.success = req.flash("success") || [];
			res.locals.errors = req.flash("errors") || [];
			res.locals.warnings = req.flash("warnings") || [];
			res.locals.user = req.user || null;
			next();
		});

		const generateEmailVerificationCode = require("./scripts/generate-Email-Verification.js");

		const createLimiter = (ms, max) => rateLimit({
			windowMs: ms,
			max,
			handler: (req, res) => {
				res.status(429).send({
					status: "error",
					message: getText("app", "tooManyRequests")
				});
			}
		});

		async function checkAuthConfigDashboardOfThread(threadData, userID) {
			if (!isNaN(threadData))
				threadData = await threadsData.get(threadData);
			return threadData.adminIDs?.includes(userID) || threadData.members?.some(m => m.userID == userID && m.permissionConfigDashboard == true) || false;
		}

		const middleWare = require("./middleware/index.js")(checkAuthConfigDashboardOfThread);

		const isVideoFile = (mimeType) => videoExt.includes(mimeDB[mimeType]?.extensions?.[0]);

		async function isVerifyRecaptcha(responseCaptcha) {
			const secret = gRecaptcha.secretKey;
			if (!secret)
				return true; // skip captcha when not configured (localhost/dev)
			const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${responseCaptcha}`;
			const verify = await axios.get(verifyUrl);
			return verify.data.success;
		}

		const {
			unAuthenticated,
			isWaitVerifyAccount,
			isAuthenticated,
			isAdmin,
			isVeryfiUserIDFacebook,
			checkHasAndInThread,
			middlewareCheckAuthConfigDashboardOfThread
		} = middleWare;

		const paramsForRoutes = {
			unAuthenticated, isWaitVerifyAccount, isAdmin, isAuthenticated,
			isVeryfiUserIDFacebook, checkHasAndInThread, middlewareCheckAuthConfigDashboardOfThread,
			isVerifyRecaptcha, validateEmail, randomNumberApikey, transporter,
			generateEmailVerificationCode, dashBoardData, expireVerifyCode, Passport, isVideoFile,
			threadsData, api, createLimiter, config, checkAuthConfigDashboardOfThread,
			imageExt, videoExt, audioExt, convertSize, drive, usersData
		};

		const registerRoute = require("./routes/register.js")(paramsForRoutes);
		const loginRoute = require("./routes/login.js")(paramsForRoutes);
		const forgotPasswordRoute = require("./routes/forgotPassword.js")(paramsForRoutes);
		const changePasswordRoute = require("./routes/changePassword.js")(paramsForRoutes);
		const dashBoardRoute = require("./routes/dashBoard.js")(paramsForRoutes);
		const verifyFbidRoute = require("./routes/verifyfbid.js")(paramsForRoutes);
		const apiRouter = require("./routes/api.js")(paramsForRoutes);

		app.get(["/", "/home"], (req, res) => {
			if (req.isAuthenticated())
				return res.redirect("/dashboard");
			res.render("home", {
				gRecaptcha_siteKey: config.credentials?.gRecaptcha_siteKey || ""
			});
		});

		app.get("/stats", async (req, res) => {
			let fcaVersion;
			try {
				fcaVersion = require("fb-chat-api/package.json").version;
			}
			catch (e) {
				fcaVersion = "unknown";
			}
			const totalThread = (await threadsData.getAll()).filter(t => t.threadID.toString().length > 15).length;
			const totalUser = (await usersData.getAll()).length;
			const prefix = config.prefix;
			const uptime = utils.convertTime(process.uptime() * 1000);
			res.render("stats", {
				fcaVersion,
				totalThread,
				totalUser,
				prefix,
				uptime,
				uptimeSecond: process.uptime()
			});
		});

		app.get("/profile", isAuthenticated, async (req, res) => {
			res.render("profile", {
				userData: await usersData.get(req.user.facebookUserID) || {}
			});
		});

		app.get("/donate", (req, res) => res.render("donate"));

		app.get("/logout", (req, res, next) => {
			req.logout(function (err) {
				if (err)
					return next(err);
				res.redirect("/");
			});
		});

		app.post("/changefbstate", isAuthenticated, isVeryfiUserIDFacebook, (req, res) => {
			const adminBot = global.GoatBot && global.GoatBot.config && global.GoatBot.config.adminBot || [];
			if (!adminBot.includes(req.user.facebookUserID))
				return res.send({
					status: "error",
					message: getText("app", "notPermissionChangeFbstate")
				});
			const { fbstate } = req.body;
			if (!fbstate)
				return res.send({
					status: "error",
					message: getText("app", "notFoundFbstate")
				});
			fs.writeFileSync(process.cwd() + (process.env.NODE_ENV == "production" || process.env.NODE_ENV == "development" ? "/account.dev.txt" : "/account.txt"), fbstate);
			res.send({
				status: "success",
				message: getText("app", "changedFbstateSuccess")
			});
		});

		app.get("/uptime", (req, res) => {
			res.send({ uptime: process.uptime() });
		});

		app.get("/changefbstate", isAuthenticated, isVeryfiUserIDFacebook, isAdmin, (req, res) => {
			let currentFbstate = "";
			try {
				currentFbstate = fs.readFileSync(process.cwd() + (process.env.NODE_ENV == "production" || process.env.NODE_ENV == "development" ? "/account.dev.txt" : "/account.txt"), "utf8");
			}
			catch (e) {
				currentFbstate = "";
			}
			res.render("changeFbstate", {
				currentFbstate
			});
		});

		app.use("/register", registerRoute);
		app.use("/login", loginRoute);
		app.use("/forgot-password", forgotPasswordRoute);
		app.use("/change-password", changePasswordRoute);
		app.use("/dashboard", dashBoardRoute);
		app.use("/verifyfbid", verifyFbidRoute);
		app.use("/api", apiRouter);

		app.get("*", (req, res) => {
			res.status(404).render("404");
		});

		app.use((err, req, res, next) => {
			if (err.message == "Login sessions require session support. Did you forget to use `express-session` middleware?")
				return res.status(500).send(getText("app", "serverError"));
		});
	}
	catch (err) {
		log.err("DASHBOARD", `Setup error (non-fatal): ${err.message}`);
	}

	// ——— ALWAYS start the server on process.env.PORT ———
	const PORT = process.env.PORT || (config && config.dashBoard && config.dashBoard.port) || (config && config.serverUptime && config.serverUptime.port) || 3001;
	await server.listen(PORT, "0.0.0.0");
	log.info("DASHBOARD", `Dashboard is running on port ${PORT}`);

	if (config && config.serverUptime && config.serverUptime.socket && config.serverUptime.socket.enable == true)
		require("../bot/login/socketIO.js")(server);
};
