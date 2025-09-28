// routes/inventoryRoute.js
const express = require("express");
const router = new express.Router();

const invController = require("../controllers/invController");
const asyncHandler = require("../utilities/asyncHandler");
const invValidate = require("../utilities/inv-validation");

// Management landing
router.get("/", asyncHandler(invController.buildManagement));

// Classification listing
router.get("/type/:classificationId", asyncHandler(invController.buildByClassificationId));

// Single-vehicle detail page
router.get("/detail/:inv_id", asyncHandler(invController.buildDetail));

// Intentional 500 error trigger
router.get("/boom", asyncHandler(invController.triggerBoom));

// ----- Add Classification -----
router.get("/add-classification", asyncHandler(invController.buildAddClassification));
router.post(
  "/add-classification",
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  asyncHandler(invController.addClassification)
);

// ----- Add Inventory -----
router.get("/add-inventory", asyncHandler(invController.buildAddInventory));
router.post(
  "/add-inventory",
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  asyncHandler(invController.addInventory)
);

module.exports = router;
