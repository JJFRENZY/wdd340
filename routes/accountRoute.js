// routes/accountRoute.js
const express = require("express");
const router = new express.Router();

const utilities = require("../utilities");
const accountController = require("../controllers/accountController");
const accValidate = require("../utilities/account-validation");

// ===== Account management (default landing after login) =====
router.get(
  "/",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountManagement)
);

// ===== Login / Register =====
router.get("/login", utilities.handleErrors(accountController.buildLogin));
router.get("/register", utilities.handleErrors(accountController.buildRegister));

router.post(
  "/register",
  accValidate.registationRules(),
  accValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
);

router.post(
  "/login",
  accValidate.loginRules(),
  accValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

// ===== Logout (clears JWT cookie) =====
router.get("/logout", utilities.handleErrors(accountController.logout));

/* ===== Task 5: Account Update ===== */
// Deliver update form (first/last/email + change-password form)
router.get(
  "/update/:account_id",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildUpdateAccount)
);

// Process basic account info update
router.post(
  "/update",
  utilities.checkLogin,
  accValidate.updateAccountRules(),
  accValidate.checkUpdateAccountData,
  utilities.handleErrors(accountController.updateAccount)
);

// Process password change
router.post(
  "/update-password",
  utilities.checkLogin,
  accValidate.updatePasswordRules(),
  accValidate.checkUpdatePasswordData,
  utilities.handleErrors(accountController.updatePassword)
);

module.exports = router;

