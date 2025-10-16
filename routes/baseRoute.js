// routes/baseRoute.js
const express = require("express");
const router = new express.Router();

const utilities = require("../utilities");
const baseController = require("../controllers/baseController");

// Root (homepage)
router.get("/", utilities.handleErrors(baseController.buildHome));

module.exports = router;
