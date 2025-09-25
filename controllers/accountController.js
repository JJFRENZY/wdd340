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

module.exports = { buildLogin };
