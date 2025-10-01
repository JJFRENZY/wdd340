// routes/accountRoute.js
const express = require("express");
const router = new express.Router();

const utilities = require("../utilities");
const accountController = require("../controllers/accountController");
const regValidate = require("../utilities/account-validation");

// Account management (default landing after login)
// ✅ Updated: added utilities.checkLogin middleware
router.get(
  "/",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountManagement)
);

// Login view
router.get(
  "/login",
  utilities.handleErrors(accountController.buildLogin)
);

// Registration view
router.get(
  "/register",
  utilities.handleErrors(accountController.buildRegister)
);

// Process registration
router.post(
  "/register",
  regValidate.registationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
);

// Process login (with server-side validation + controller)
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

// Logout (clears JWT cookie)
router.get(
  "/logout",
  utilities.handleErrors(accountController.logout)
);

module.exports = router;
