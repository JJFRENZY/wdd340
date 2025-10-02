// routes/inventoryRoute.js
const express = require("express")
const router = new express.Router()

const invController = require("../controllers/invController")
const asyncHandler = require("../utilities/asyncHandler")
const invValidate = require("../utilities/inv-validation")

// Management landing
router.get("/", asyncHandler(invController.buildManagement))

// Classification listing
router.get("/type/:classificationId", asyncHandler(invController.buildByClassificationId))

// Single-vehicle detail page (full EJS view)
router.get("/detail/:inv_id", asyncHandler(invController.buildDetail))

// Minimal debug detail (no EJS/partials) — TEMPORARY
router.get("/detail-min/:inv_id", asyncHandler(invController.buildDetailMinimal))

// JSON endpoint for AJAX
router.get("/getInventory/:classification_id", asyncHandler(invController.getInventoryJSON))

// Intentional 500 error trigger
router.get("/boom", asyncHandler(invController.triggerBoom))

// ----- Add Classification -----
router.get("/add-classification", asyncHandler(invController.buildAddClassification))
router.post(
  "/add-classification",
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  asyncHandler(invController.addClassification)
)

// ----- Add Inventory -----
router.get("/add-inventory", asyncHandler(invController.buildAddInventory))
router.post(
  "/add-inventory",
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  asyncHandler(invController.addInventory)
)

module.exports = router
