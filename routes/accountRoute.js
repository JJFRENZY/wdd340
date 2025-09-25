// routes/accountRoute.js
const express = require("express");
const router = new express.Router();

const asyncHandler = require("../utilities/asyncHandler");
const utilities = require("../utilities");
const accountController = require("../controllers/accountController");
const regValidate = require("../utilities/account-validation");

// Deliver login + register views
router.get("/login", asyncHandler(accountController.buildLogin));
router.get("/register", asyncHandler(accountController.buildRegister));

// Process the registration data (validate -> check -> controller)
router.post(
  "/register",
  regValidate.registationRules(), // (alias of .registrationRules)
  regValidate.checkRegData,
  asyncHandler(accountController.registerAccount)
);

module.exports = router;
