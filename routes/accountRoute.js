const express = require("express");
const router = express.Router();

const asyncHandler = require("../utilities/asyncHandler");
const accountController = require("../controllers/accountController");

// GET /account/login
router.get("/login", asyncHandler(accountController.buildLogin));

module.exports = router;
