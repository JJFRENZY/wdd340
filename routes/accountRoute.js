// routes/accountRoute.js
const express = require("express");
const router = new express.Router();

const utilities = require("../utilities");
const accountController = require("../controllers/accountController");
const regValidate = require("../utilities/account-validation");

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

// TEMP: Process login (validation only; real auth comes later)
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  (req, res) => {
    res.status(200).send("login process");
  }
);

module.exports = router;
