// controllers/accountController.js
const utilities = require("../utilities");
const accountModel = require("../models/account-model");
const bcrypt = require("bcryptjs"); // <-- NEW

const accountController = {};

/* ****************************************
 *  Deliver login view
 * *************************************** */
accountController.buildLogin = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    res.render("account/login", {
      title: "Login",
      nav,
      errors: null, // so view can safely reference errors
      account_email: "", // sticky default
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
    const nav = await utilities.getNav();
    res.render("account/register", {
      title: "Register",
      nav,
      errors: null, // important for first load
      account_firstname: "",
      account_lastname: "",
      account_email: "",
    });
  } catch (err) {
    next(err);
  }
};

/* ****************************************
 *  Process Registration (with password hashing)
 * *************************************** */
accountController.registerAccount = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    const {
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    } = req.body;

    // Hash the password before storing
    let hashedPassword;
    try {
      // 10 salt rounds is a solid default
      hashedPassword = await bcrypt.hash(account_password, 10);
    } catch (error) {
      req.flash("notice", "Sorry, there was an error processing the registration.");
      return res.status(500).render("account/register", {
        title: "Register",
        nav,
        errors: null,
        account_firstname,
        account_lastname,
        account_email,
      });
    }

    // Save with the hashed password
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    );

    if (regResult && regResult.rowCount === 1) {
      req.flash(
        "notice",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      );
      return res.status(201).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email, // prefill email
      });
    }

    // Fallback if insert failed without throwing
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
    next(err);
  }
};

module.exports = accountController;
