// routes/accountRoute.js
const express = require("express");
const router = new express.Router();

const accountController = require("../controllers/accountController");
const asyncHandler = require("../utilities/asyncHandler");

// GET /account/login  → render login view
router.get("/login", asyncHandler(accountController.buildLogin));

module.exports = router;
