// controllers/invController.js  (UPDATED)
const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

/* =========================================
 * Management view (UPDATE: add classificationSelect)
 * ========================================= */
exports.buildManagementView = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    const classificationSelect = await utilities.buildClassificationList()

    return res.render("./inventory/management", {
      title: "Inventory Management",
      nav,
      classificationSelect,
      errors: null,
      notice: req.flash("notice"),
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * Some routes in your app call invController.buildManagement (not ...View).
 * Provide a thin alias so both names work.
 */
exports.buildManagement = (req, res, next) =>
  exports.buildManagementView(req, res, next)

/* ***************************
 *  Return Inventory by Classification As JSON (AJAX)
 * ************************** */
exports.getInventoryJSON = async (req, res, next) => {
  try {
    const classification_id = parseInt(req.params.classification_id, 10)
    if (Number.isNaN(classification_id)) {
      const badReq = new Error("Invalid classification id")
      badReq.status = 400
      throw badReq
    }

    // Support either an array return OR { rows } from the model
    const raw = await invModel.getInventoryByClassificationId(classification_id)
    const invData = Array.isArray(raw) ? raw : raw?.rows || []

    // Return an array (possibly empty)
    return res.json(invData)
  } catch (err) {
    return next(err)
  }
}

/* ***************************
 *  Vehicle Detail Page
 *  Route: GET /inv/detail/:inv_id
 * ************************** */
exports.buildDetail = async (req, res, next) => {
  try {
    const inv_id = parseInt(req.params.inv_id, 10)
    if (Number.isNaN(inv_id)) {
      const err = new Error("Invalid vehicle id")
      err.status = 400
      throw err
    }

    const vehicle = await invModel.getVehicleById(inv_id)
    if (!vehicle) {
      const err = new Error("Vehicle not found")
      err.status = 404
      throw err
    }

    const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`
    const vehicleDetail = utilities.buildVehicleDetailHtml(vehicle)
    const nav = await utilities.getNav(req, res, next)

    return res.render("./inventory/detail", {
      title,
      nav,
      vehicleDetail,
      errors: null,
      notice: req.flash("notice"),
    })
  } catch (err) {
    return next(err)
  }
}

/* ***************************
 *  Intentional 500 Error (Task 3)
 *  Route: GET /inv/boom
 * ************************** */
exports.triggerBoom = async (_req, _res, _next) => {
  const err = new Error("Intentional server error for testing 500 flow")
  err.status = 500
  throw err
}
