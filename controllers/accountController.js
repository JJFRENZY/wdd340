// controllers/accountController.js
const utilities = require("../utilities");
const accountModel = require("../models/account-model");

const accountController = {};

/* ****************************************
 *  Deliver login view
 * *************************************** */
accountController.buildLogin = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    res.render("account/login", {
      title: "Login",
      nav,
      errors: null, // important for views that may expect it
    });
  } catch (err) {
    next(err);
  }
};

/* ****************************************
 *  Deliver registration view
 * *************************************** */
accountController.buildRegister = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    res.render("account/register", {
      title: "Register",
      nav,
      errors: null, // important (prevents EJS error before any validation)
      // optional: default sticky values
      account_firstname: "",
      account_lastname: "",
      account_email: "",
    });
  } catch (err) {
    next(err);
  }
};

/* ****************************************
 *  Process Registration
 * *************************************** */
accountController.registerAccount = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    const {
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    } = req.body;

    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      account_password
    );

    if (regResult && regResult.rows && regResult.rows.length) {
      req.flash(
        "success",
        `Congratulations, you're registered, ${account_firstname}. Please log in.`
      );
      return res.status(201).render("account/login", {
        title: "Login",
        nav,
        errors: null,
      });
    }

    // If we reach here, the DB insert didn't return rows
    req.flash("error", "Sorry, the registration failed.");
    return res.status(501).render("account/register", {
      title: "Register",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
    });
  } catch (err) {
    // DB/other error
    req.flash("error", "Registration failed due to a server error.");
    try {
      const nav = await utilities.getNav(req, res, next);
      return res.status(500).render("account/register", {
        title: "Register",
        nav,
        errors: null,
        account_firstname: req.body.account_firstname,
        account_lastname: req.body.account_lastname,
        account_email: req.body.account_email,
      });
    } catch (_) {
      return next(err);
    }
  }
};

module.exports = accountController;
