// routes/inventoryRoute.js  (UPDATED)
const express = require("express");
const router = new express.Router();

const invController = require("../controllers/invController");
const asyncHandler = require("../utilities/asyncHandler");
const invValidate = require("../utilities/inv-validation");
// const utilities = require("../utilities"); // <- Uncomment if you want to gate management with login (see note below)

// Management landing
router.get(
  "/",
  // utilities.checkLogin, // Optional: require login/role before accessing management
  asyncHandler(invController.buildManagement)
);

// Classification listing
router.get(
  "/type/:classificationId",
  asyncHandler(invController.buildByClassificationId)
);

// Single-vehicle detail page
router.get(
  "/detail/:inv_id",
  asyncHandler(invController.buildDetail)
);

// ✅ JSON endpoint for AJAX (Select Inventory Items)
router.get(
  "/getInventory/:classification_id",
  asyncHandler(invController.getInventoryJSON)
);

// Intentional 500 error trigger (Task 3)
router.get(
  "/boom",
  asyncHandler(invController.triggerBoom)
);

// ----- Add Classification -----
router.get(
  "/add-classification",
  asyncHandler(invController.buildAddClassification)
);

router.post(
  "/add-classification",
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  asyncHandler(invController.addClassification)
);

// ----- Add Inventory -----
router.get(
  "/add-inventory",
  asyncHandler(invController.buildAddInventory)
);

router.post(
  "/add-inventory",
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  asyncHandler(invController.addInventory)
);

module.exports = router;
