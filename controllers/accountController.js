// controllers/accountController.js  (UPDATED FOR A5)
const utilities = require("../utilities");
const accountModel = require("../models/account-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// NOTE: server.js already loads dotenv; no need to load it again here.

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
      errors: null,
      account_email: "",
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
      errors: null,
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
    const nav = await utilities.getNav(req, res, next);
    const {
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    } = req.body;

    // Hash the password before storing
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(account_password, 10);
    } catch (_error) {
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

    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email.toLowerCase().trim(),
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
        account_email,
      });
    }

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

/* ****************************************
 *  Account management landing (GET /account)
 * *************************************** */
accountController.buildAccountManagement = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    res.render("account/management", {
      title: "Account Management",
      nav,
      errors: null,
      // notice/messages available via res.locals.messages + req.flash
    });
  } catch (err) {
    next(err);
  }
};

/* ****************************************
 *  Process login request (JWT + cookie)
 * *************************************** */
accountController.accountLogin = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    const { account_email, account_password } = req.body;

    const accountData = await accountModel.getAccountByEmail(
      account_email.toLowerCase().trim()
    );
    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      });
    }

    const passwordOK = await bcrypt.compare(
      account_password,
      accountData.account_password
    );
    if (!passwordOK) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      });
    }

    // Success: sign JWT (exclude hash from payload)
    const payload = {
      account_id: accountData.account_id,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
      account_type: accountData.account_type,
    };

    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET is not set");
    }

    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    // Send JWT in httpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60, // 1 hour
      path: "/",
    });

    return res.redirect("/account/");
  } catch (err) {
    next(err);
  }
};

/* ****************************************
 *  Logout (clear cookie)
 * *************************************** */
accountController.logout = async function (req, res, next) {
  try {
    res.clearCookie("jwt", { path: "/" });
    req.flash("notice", "You have been logged out.");
    return res.redirect("/account/login");
  } catch (err) {
    next(err);
  }
};

/* ****************************************
 *  Deliver Update Account view (GET /account/update/:account_id)
 *  - Requires login (enforced in route)
 *  - Only allow the owner (or Employee/Admin) to view
 * *************************************** */
accountController.buildUpdateAccount = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    const account_id = parseInt(req.params.account_id, 10);
    if (Number.isNaN(account_id)) {
      const e = new Error("Invalid account id");
      e.status = 400;
      throw e;
    }

    // Authorization: owner or elevated role
    const viewer = res.locals.accountData;
    const isOwner = viewer && Number(viewer.account_id) === account_id;
    const isElevated =
      viewer && (viewer.account_type === "Employee" || viewer.account_type === "Admin");

    if (!isOwner && !isElevated) {
      req.flash("notice", "You are not authorized to edit this account.");
      return res.redirect("/account/");
    }

    const acct = await accountModel.getAccountById(account_id);
    if (!acct) {
      const e = new Error("Account not found");
      e.status = 404;
      throw e;
    }

    return res.render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id: acct.account_id,
      account_firstname: acct.account_firstname,
      account_lastname: acct.account_lastname,
      account_email: acct.account_email,
    });
  } catch (err) {
    next(err);
  }
};

/* ****************************************
 *  Handle Account (name/email) Update (POST /account/update)
 *  - Validation occurs in middleware
 *  - Refresh JWT so header greeting stays current
 * *************************************** */
accountController.updateAccount = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    const {
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    } = req.body;

    // Perform update
    const updateResult = await accountModel.updateAccount({
      account_id: Number(account_id),
      account_firstname,
      account_lastname,
      account_email: account_email.toLowerCase().trim(),
    });

    const ok =
      (updateResult && updateResult.rowCount === 1) ||
      (updateResult && updateResult.account_id); // support returning updated row

    if (!ok) {
      req.flash("notice", "Sorry, the account update failed.");
      return res.status(400).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_id,
        account_firstname,
        account_lastname,
        account_email,
      });
    }

    // Fetch fresh data
    const updated = await accountModel.getAccountById(Number(account_id));

    // Refresh JWT so UI (header greeting) reflects changes
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET is not set");
    }
    const token = jwt.sign(
      {
        account_id: updated.account_id,
        account_firstname: updated.account_firstname,
        account_lastname: updated.account_lastname,
        account_email: updated.account_email,
        account_type: updated.account_type,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60,
      path: "/",
    });

    req.flash("notice", "Account information updated.");
    return res.redirect("/account/");
  } catch (err) {
    next(err);
  }
};

/* ****************************************
 *  Handle Password Change (POST /account/update-password)
 *  - Validation occurs in middleware
 * *************************************** */
accountController.updatePassword = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    const { account_id, account_password } = req.body;

    const hash = await bcrypt.hash(account_password, 10);

    // ⚠️ Model signature is (account_id, hashedPassword)
    const pwResult = await accountModel.updatePassword(Number(account_id), hash);

    const ok = pwResult && typeof pwResult.rowCount === "number" && pwResult.rowCount === 1;

    if (!ok) {
      req.flash("notice", "Sorry, the password update failed.");
      // Re-hydrate sticky fields for the other form
      const acct = await accountModel.getAccountById(Number(account_id));
      return res.status(400).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_id,
        account_firstname: acct?.account_firstname || "",
        account_lastname: acct?.account_lastname || "",
        account_email: acct?.account_email || "",
      });
    }

    req.flash("notice", "Password updated.");
    return res.redirect("/account/");
  } catch (err) {
    next(err);
  }
};

module.exports = accountController;
