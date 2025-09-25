// routes/accountRoute.js
const express = require("express");
const router = new express.Router();

const accountController = require("../controllers/accountController");
const asyncHandler = require("../utilities/asyncHandler");

// GET /account/login
router.get("/login", asyncHandler(accountController.buildLogin));

// GET /account/register
router.get("/register", asyncHandler(accountController.buildRegister));

// TEMP: POST /account/login (stub to demonstrate flash + redirect)
router.post("/login", asyncHandler(accountController.loginStub));

module.exports = router;
