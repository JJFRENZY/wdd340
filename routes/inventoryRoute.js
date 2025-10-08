// routes/inventoryRoute.js
const express = require("express");
const router = new express.Router();

const invController = require("../controllers/invController");
const asyncHandler = require("../utilities/asyncHandler");
const invValidate = require("../utilities/inv-validation");
const { requireEmployeeOrAdmin } = require("../middleware/requireRole");

// ===== Public routes (no auth gating) =====

// Classification listing
router.get(
  "/type/:classificationId",
  asyncHandler(invController.buildByClassificationId)
);

// Single-vehicle detail page (full EJS view)
router.get("/detail/:inv_id", asyncHandler(invController.buildDetail));

// Minimal debug detail (no EJS/partials) — optional helper
router.get("/detail-min/:inv_id", asyncHandler(invController.buildDetailMinimal));

// JSON endpoint for AJAX (public)
router.get(
  "/getInventory/:classification_id",
  asyncHandler(invController.getInventoryJSON)
);

// Intentional 500 error trigger (A3 Task 3)
router.get("/boom", asyncHandler(invController.triggerBoom));

// ===== Admin routes (Employee/Admin only) =====

// Management landing
router.get("/", requireEmployeeOrAdmin, asyncHandler(invController.buildManagement));

// Add Classification
router.get(
  "/add-classification",
  requireEmployeeOrAdmin,
  asyncHandler(invController.buildAddClassification)
);
router.post(
  "/add-classification",
  requireEmployeeOrAdmin,
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  asyncHandler(invController.addClassification)
);

// Add Inventory
router.get("/add-inventory", requireEmployeeOrAdmin, asyncHandler(invController.buildAddInventory));
router.post(
  "/add-inventory",
  requireEmployeeOrAdmin,
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  asyncHandler(invController.addInventory)
);

// Edit / Update Inventory
router.get("/edit/:inv_id", requireEmployeeOrAdmin, asyncHandler(invController.buildEditInventory));
router.post(
  "/update",
  requireEmployeeOrAdmin,
  invValidate.updateRules(),     // includes inv_id check
  invValidate.checkUpdateData,   // returns to edit view on errors (sticky)
  asyncHandler(invController.updateInventory)
);

// Delete Inventory
router.get("/delete/:inv_id", requireEmployeeOrAdmin, asyncHandler(invController.buildDeleteConfirm));
router.post("/delete", requireEmployeeOrAdmin, asyncHandler(invController.deleteInventory));

module.exports = router;
