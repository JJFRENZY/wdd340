// routes/accountRoute.js
const express = require("express");
const router = new express.Router();

const accountController = require("../controllers/accountController");
const asyncHandler = require("../utilities/asyncHandler");
const { registerRules } = require("../validators/accountValidators");

// GET /account/login
router.get("/login", asyncHandler(accountController.buildLogin));

// GET /account/register
router.get("/register", asyncHandler(accountController.buildRegister));

// POST /account/register  (validate -> controller)
router.post(
  "/register",
  registerRules,
  asyncHandler(accountController.registerAccount)
);

// (Temp) POST /account/login (keeps form working for now)
router.post("/login", asyncHandler(accountController.loginStub));

module.exports = router;
