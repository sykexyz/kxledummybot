const expres = require("express");
const router = expres.Router();

module.exports = function ({ unAuthenticated, isVerifyRecaptcha, Passport }) {
	router
		.get("/", unAuthenticated, (req, res) => {
			req.session.redirectTo = req.query.redirect || "/";
			res.render("login");
		})
		.post("/", unAuthenticated, async (req, res, next) => {
			try {
				if (!await isVerifyRecaptcha(req.body["g-recaptcha-response"]))
					return res.status(400).send({
						status: "error",
						errors: [{ msg: "Captcha không hợp lệ" }]
					});

				Passport.authenticate("local", function (err, user, info) {
					if (err)
						return next(err);

					if (!user) {
						return res.status(400).send({
							status: "error",
							errors: [{ msg: info.message || "Sai email hoặc mật khẩu" }]
						});
					}
					const redirectLink = req.session.redirectTo || "/";

					req.login(user, function (err) {
						if (err)
							return next(err);

						res.send({
							status: "success",
							redirectLink
						});
					});
				})(req, res, next);
			}
			catch (err) {
				console.error("LOGIN ERROR:", err);
				return res.status(500).send({
					status: "error",
					errors: [{ msg: "Lỗi máy chủ: " + err.message }]
				});
			}
		});

	return router;
};