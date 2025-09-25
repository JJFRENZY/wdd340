// controllers/accountController.js
const utilities = require("../utilities");

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    res.render("account/login", {
      title: "Login",
      nav,
    });
  } catch (err) {
    next(err);
  }
}

/* ****************************************
 *  Deliver register view (placeholder)
 * *************************************** */
async function buildRegister(req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    res.render("account/register", {
      title: "Register",
      nav,
    });
  } catch (err) {
    next(err);
  }
}

/* ****************************************
 *  TEMP: Handle login POST (demo only)
 *  Shows flash and redirects home.
 * *************************************** */
async function loginStub(req, res) {
  req.flash("notice", "Login attempt received (demo only).");
  res.redirect("/");
}

module.exports = {
  buildLogin,
  buildRegister,
  loginStub,
};
