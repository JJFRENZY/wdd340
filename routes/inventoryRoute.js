// routes/inventoryRoute.js

const express = require("express");
const router = new express.Router();

const invController = require("../controllers/invController");
const asyncHandler = require("../utilities/asyncHandler");

// Classification listing (existing)
router.get("/type/:classificationId",
  asyncHandler(invController.buildByClassificationId)
);

// NEW: Single-vehicle detail page (Task 1)
router.get("/detail/:inv_id",
  asyncHandler(invController.buildDetail)
);

// NEW: Intentional 500 error trigger (Task 3)
router.get("/boom",
  asyncHandler(invController.triggerBoom) // throws; caught by error middleware
);

module.exports = router;
