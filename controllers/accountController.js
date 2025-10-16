// controllers/accountController.js  (UPDATED FOR A5/A6)
"use strict";

const utilities = require("../utilities"); // kept for compatibility if you still call utilities in views
const accountModel = require("../models/account-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helpers
function ensureSecret() {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("ACCESS_TOKEN_SECRET is not set");
  }
  return secret;
}

function signJwt(payload, ttl = "1h") {
  return jwt.sign(payload, ensureSecret(), { expiresIn: ttl });
}

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: String(process.env.NODE_ENV).toLowerCase() === "production",
    maxAge: 1000 * 60 * 60, // 1 hour
    path: "/",
  };
}

function normalizedEmail(s) {
  return String(s || "").toLowerCase().trim();
}

const accountController = {};

/* ****************************************
 *  Deliver login view
 * *************************************** */
accountController.buildLogin = async function (req, res, next) {
  try {
    // nav is set by nav middleware -> res.locals.nav
    res.render("account/login", {
      title: "Login",
      nav: res.locals.nav || "",
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
    res.render("account/register", {
      title: "Register",
      nav: res.locals.nav || "",
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
    const {
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    } = req.body;

    // Hash the password before storing
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(String(account_password), 10);
    } catch (_error) {
      req.flash("notice", "Sorry, there was an error processing the registration.");
      return res.status(500).render("account/register", {
        title: "Register",
        nav: res.locals.nav || "",
        errors: null,
        account_firstname,
        account_lastname,
        account_email,
      });
    }

    // Try insert
    try {
      const regResult = await accountModel.registerAccount(
        String(account_firstname || "").trim(),
        String(account_lastname || "").trim(),
        normalizedEmail(account_email),
        hashedPassword
      );

      const ok =
        (regResult && regResult.rowCount === 1) ||
        (regResult && regResult.account_id);

      if (ok) {
        req.flash(
          "notice",
          `Congratulations, you're registered ${account_firstname}. Please log in.`
        );
        return res.status(201).render("account/login", {
          title: "Login",
          nav: res.locals.nav || "",
          errors: null,
          account_email,
        });
      }
    } catch (e) {
      // Handle duplicate email (Postgres unique violation)
      if (e && (e.code === "23505" || /duplicate key/i.test(e.message || ""))) {
        req.flash("notice", "That email is already registered. Please log in.");
        return res.status(409).render("account/login", {
          title: "Login",
          nav: res.locals.nav || "",
          errors: null,
          account_email,
        });
      }
      throw e;
    }

    req.flash("error", "Sorry, the registration failed.");
    return res.status(501).render("account/register", {
      title: "Register",
      nav: res.locals.nav || "",
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
    res.render("account/management", {
      title: "Account Management",
      nav: res.locals.nav || "",
      errors: null,
      // flash messages available via res.locals.messages / req.flash
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
    const email = normalizedEmail(req.body.account_email);
    const { account_password } = req.body;

    const accountData = await accountModel.getAccountByEmail(email);
    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav: res.locals.nav || "",
        errors: null,
        account_email: req.body.account_email || "",
      });
    }

    const passwordOK = await bcrypt.compare(
      String(account_password),
      String(accountData.account_password)
    );
    if (!passwordOK) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav: res.locals.nav || "",
        errors: null,
        account_email: req.body.account_email || "",
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

    const token = signJwt(payload, "1h");

    // Send JWT in httpOnly cookie
    res.cookie("jwt", token, cookieOpts());

    // Respect 'returnTo' if set (e.g., by requireRole)
    const dest = (req.session && req.session.returnTo) || "/account/";
    if (req.session) delete req.session.returnTo;

    return res.redirect(dest);
  } catch (err) {
    next(err);
  }
};

/* ****************************************
 *  Logout (clear cookie)
 * *************************************** */
accountController.logout = async function (_req, res, next) {
  try {
    res.clearCookie("jwt", { path: "/" });
    // Clear any stored returnTo
    try { if (_req.session) delete _req.session.returnTo; } catch {}
    _req.flash("notice", "You have been logged out.");
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
      nav: res.locals.nav || "",
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
    const {
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    } = req.body;

    // Perform update
    const updateResult = await accountModel.updateAccount({
      account_id: Number(account_id),
      account_firstname: String(account_firstname || "").trim(),
      account_lastname: String(account_lastname || "").trim(),
      account_email: normalizedEmail(account_email),
    });

    const ok =
      (updateResult && updateResult.rowCount === 1) ||
      (updateResult && updateResult.account_id); // support returning updated row

    if (!ok) {
      req.flash("notice", "Sorry, the account update failed.");
      return res.status(400).render("account/update", {
        title: "Update Account",
        nav: res.locals.nav || "",
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
    const token = signJwt({
      account_id: updated.account_id,
      account_firstname: updated.account_firstname,
      account_lastname: updated.account_lastname,
      account_email: updated.account_email,
      account_type: updated.account_type,
    }, "1h");

    res.cookie("jwt", token, cookieOpts());

    req.flash("notice", "Account information updated.");
    return res.redirect("/account/");
  } catch (err) {
    // Handle duplicate email on update as 409
    if (err && (err.code === "23505" || /duplicate key/i.test(err.message || ""))) {
      req.flash("notice", "That email address is already in use.");
      const { account_id, account_firstname, account_lastname, account_email } = req.body;
      return res.status(409).render("account/update", {
        title: "Update Account",
        nav: res.locals.nav || "",
        errors: null,
        account_id,
        account_firstname,
        account_lastname,
        account_email,
      });
    }
    next(err);
  }
};

/* ****************************************
 *  Handle Password Change (POST /account/update-password)
 *  - Validation occurs in middleware
 * *************************************** */
accountController.updatePassword = async function (req, res, next) {
  try {
    const { account_id, account_password } = req.body;

    const hash = await bcrypt.hash(String(account_password), 10);

    // Model signature is (account_id, hashedPassword)
    const pwResult = await accountModel.updatePassword(Number(account_id), hash);

    const ok =
      pwResult && typeof pwResult.rowCount === "number" && pwResult.rowCount === 1;

    if (!ok) {
      req.flash("notice", "Sorry, the password update failed.");
      // Re-hydrate sticky fields for the other form
      const acct = await accountModel.getAccountById(Number(account_id));
      return res.status(400).render("account/update", {
        title: "Update Account",
        nav: res.locals.nav || "",
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
