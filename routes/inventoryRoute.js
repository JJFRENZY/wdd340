// routes/inventoryRoute.js
const express = require("express");
const router = new express.Router();

const invController = require("../controllers/invController");
const asyncHandler = require("../utilities/asyncHandler");
const invValidate = require("../utilities/inv-validation");

// ===== Management landing =====
router.get("/", asyncHandler(invController.buildManagement));

// ===== Classification listing =====
router.get(
  "/type/:classificationId",
  asyncHandler(invController.buildByClassificationId)
);

// ===== Single-vehicle detail page (full EJS view) =====
router.get("/detail/:inv_id", asyncHandler(invController.buildDetail));

// ===== Minimal debug detail (no EJS/partials) — optional helper =====
router.get("/detail-min/:inv_id", asyncHandler(invController.buildDetailMinimal));

// ===== JSON endpoint for AJAX (management select -> table) =====
router.get(
  "/getInventory/:classification_id",
  asyncHandler(invController.getInventoryJSON)
);

// ===== Intentional 500 error trigger (A3 Task 3) =====
router.get("/boom", asyncHandler(invController.triggerBoom));

/* ========= Add Classification ========= */
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

/* ========= Add Inventory ========= */
router.get("/add-inventory", asyncHandler(invController.buildAddInventory));
router.post(
  "/add-inventory",
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  asyncHandler(invController.addInventory)
);

/* ========= Edit / Update Inventory ========= */
// Step 1: deliver the edit form
router.get("/edit/:inv_id", asyncHandler(invController.buildEditInventory));

// Step 2: process the update (validate inv_id + all fields)
router.post(
  "/update",
  invValidate.updateRules(),     // includes inv_id check
  invValidate.checkUpdateData,   // returns to edit view on errors (sticky)
  asyncHandler(invController.updateInventory)
);

/* ========= Delete Inventory ========= */
// Step 1: deliver delete confirmation view
router.get("/delete/:inv_id", asyncHandler(invController.buildDeleteConfirm));

// Step 2: perform the delete
router.post("/delete", asyncHandler(invController.deleteInventory));

module.exports = router;
