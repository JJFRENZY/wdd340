// controllers/accountController.js
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

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
      errors: [],
      // sticky defaults (empty)
      account_firstname: "",
      account_lastname: "",
      account_email: "",
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

    // 1) Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("account/register", {
        title: "Register",
        nav,
        errors: errors.array(),
        // sticky values (never echo password)
        account_firstname: req.body.account_firstname || "",
        account_lastname: req.body.account_lastname || "",
        account_email: req.body.account_email || "",
      });
    }

    const {
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    } = req.body;

    // 2) Hash password
    const hashed = await bcrypt.hash(account_password, 12);

    // 3) Write to DB
    const created = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashed
    );

    // 4) Done
    req.flash(
      "notice",
      `Congratulations, you're registered ${created.account_firstname}. Please log in.`
    );
    return res.status(201).render("account/login", {
      title: "Login",
      nav,
    });
  } catch (err) {
    // Handle duplicate email (unique constraint)
    if (err && err.code === "23505") {
      const nav = await utilities.getNav(req, res, next);
      req.flash("notice", "That email is already registered. Please log in.");
      return res.status(409).render("account/login", {
        title: "Login",
        nav,
      });
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
