// controllers/accountController.js  (UPDATED)
const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// NOTE: server.js already loads dotenv; no need to load it again here.

const accountController = {}

/* ****************************************
 *  Deliver login view
 * *************************************** */
accountController.buildLogin = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    res.render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email: "",
    })
  } catch (err) {
    next(err)
  }
}

/* ****************************************
 *  Deliver registration view
 * *************************************** */
accountController.buildRegister = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    res.render("account/register", {
      title: "Register",
      nav,
      errors: null,
      account_firstname: "",
      account_lastname: "",
      account_email: "",
    })
  } catch (err) {
    next(err)
  }
}

/* ****************************************
 *  Process Registration (with password hashing)
 * *************************************** */
accountController.registerAccount = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    const {
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    } = req.body

    // Hash the password before storing
    let hashedPassword
    try {
      hashedPassword = await bcrypt.hash(account_password, 10)
    } catch (_error) {
      req.flash("notice", "Sorry, there was an error processing the registration.")
      return res.status(500).render("account/register", {
        title: "Register",
        nav,
        errors: null,
        account_firstname,
        account_lastname,
        account_email,
      })
    }

    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email.toLowerCase().trim(),
      hashedPassword
    )

    if (regResult && regResult.rowCount === 1) {
      req.flash(
        "notice",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      )
      return res.status(201).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    req.flash("error", "Sorry, the registration failed.")
    return res.status(501).render("account/register", {
      title: "Register",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
    })
  } catch (err) {
    next(err)
  }
}

/* ****************************************
 *  Account management landing (GET /account)
 * *************************************** */
accountController.buildAccountManagement = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    res.render("account/management", {
      title: "Account Management",
      nav,
      errors: null,
      // notice/messages available via res.locals.messages + req.flash
    })
  } catch (err) {
    next(err)
  }
}

/* ****************************************
 *  Process login request (JWT + cookie)
 * *************************************** */
accountController.accountLogin = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    const { account_email, account_password } = req.body

    const accountData = await accountModel.getAccountByEmail(
      account_email.toLowerCase().trim()
    )
    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    const passwordOK = await bcrypt.compare(
      account_password,
      accountData.account_password
    )
    if (!passwordOK) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    // Success: sign JWT (exclude hash from payload)
    // Clone + delete to avoid mutating the original row object accidentally
    const payload = {
      account_id: accountData.account_id,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
      account_type: accountData.account_type,
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      // Graceful failure if secret is missing in env
      throw new Error("ACCESS_TOKEN_SECRET is not set")
    }

    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    })

    // Send JWT in httpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60, // 1 hour in ms
      path: "/", // so all routes can read it
    })

    return res.redirect("/account/")
  } catch (err) {
    next(err)
  }
}

/* ****************************************
 *  Logout (clear cookie)
 * *************************************** */
accountController.logout = async function (_req, res, next) {
  try {
    res.clearCookie("jwt", { path: "/" })
    req.flash("notice", "You have been logged out.")
    return res.redirect("/account/login")
  } catch (err) {
    next(err)
  }
}

module.exports = accountController
