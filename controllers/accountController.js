// controllers/accountController.js
const utilities = require("../utilities");
const accountModel = require("../models/account-model");

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
 *  Deliver registration view
 * *************************************** */
async function buildRegister(req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    res.render("account/register", {
      title: "Register",
      nav,
      errors: null,
    });
  } catch (err) {
    next(err);
  }
}

/* ****************************************
 *  Process Registration
 * *************************************** */
async function registerAccount(req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    const {
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    } = req.body;

    const created = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      account_password
    );

    if (created && created.account_id) {
      req.flash(
        "notice",
        `Congratulations, you're registered ${created.account_firstname}. Please log in.`
      );
      return res.status(201).render("account/login", {
        title: "Login",
        nav,
      });
    }

    req.flash("notice", "Sorry, the registration failed.");
    return res.status(500).render("account/register", {
      title: "Register",
      nav,
      errors: null,
    });
  } catch (err) {
    // Unique violation (duplicate email) from Postgres
    if (err && err.code === "23505") {
      const nav = await utilities.getNav(req, res, next);
      req.flash("notice", "That email is already registered. Please log in.");
      return res.status(409).render("account/login", { title: "Login", nav });
    }
    return next(err);
  }
}

/* ****************************************
 *  TEMP login stub (keeps your POST /account/login working)
 * *************************************** */
async function loginStub(req, res) {
  req.flash("notice", "Login not implemented yet (demo).");
  res.redirect("/account/login");
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  loginStub,
};
