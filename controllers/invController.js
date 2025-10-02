// controllers/invController.js
const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

/* =========================================
 * Management view (adds classificationSelect)
 * ========================================= */
exports.buildManagementView = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    const classificationSelect = await utilities.buildClassificationList()
    return res.render("inventory/management", {
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

/** Alias so routes can call either name */
exports.buildManagement = (req, res, next) =>
  exports.buildManagementView(req, res, next)

/* =========================================
 * Classification list view (server-rendered)
 * Route: GET /inv/type/:classificationId
 * ========================================= */
exports.buildByClassificationId = async function (req, res, next) {
  try {
    const classificationId = parseInt(req.params.classificationId, 10)
    if (Number.isNaN(classificationId)) {
      const err = new Error("Invalid classification id")
      err.status = 400
      throw err
    }

    const rows = await invModel.getInventoryByClassificationId(classificationId)
    const nav = await utilities.getNav(req, res, next)
    const grid = await utilities.buildClassificationGrid(rows)

    // Nice title if we have data, otherwise generic
    const title =
      rows && rows.length
        ? `${rows[0].classification_name} Vehicles`
        : "Vehicles"

    return res.render("inventory/classification", {
      title,
      nav,
      grid,
      errors: null,
      notice: req.flash("notice"),
    })
  } catch (err) {
    return next(err)
  }
}

/* =========================================
 * Add Classification (view)
 * ========================================= */
exports.buildAddClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    return res.render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: null,
      notice: req.flash("notice"),
    })
  } catch (err) {
    return next(err)
  }
}

/* =========================================
 * Add Classification (POST)
 * ========================================= */
exports.addClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    const { classification_name } = req.body

    const result = await invModel.addClassification(classification_name)
    if (result) {
      req.flash("notice", `Classification "${result.classification_name}" added.`)
      return res.redirect("/inv")
    }

    req.flash("notice", "Sorry, adding the classification failed.")
    return res.status(400).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: null,
    })
  } catch (err) {
    return next(err)
  }
}

/* =========================================
 * Add Inventory (view)
 * ========================================= */
exports.buildAddInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    const classificationSelect = await utilities.buildClassificationList()
    return res.render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationSelect,
      errors: null,
      notice: req.flash("notice"),
    })
  } catch (err) {
    return next(err)
  }
}

/* =========================================
 * Add Inventory (POST)
 * ========================================= */
exports.addInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next)
    const payload = {
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_year: req.body.inv_year,
      inv_description: req.body.inv_description,
      inv_image: req.body.inv_image,
      inv_thumbnail: req.body.inv_thumbnail,
      inv_price: req.body.inv_price,
      inv_miles: req.body.inv_miles,
      inv_color: req.body.inv_color,
      classification_id: req.body.classification_id,
    }

    const result = await invModel.addInventory(payload)
    if (result) {
      req.flash("notice", `Added ${result.inv_year} ${result.inv_make} ${result.inv_model}.`)
      return res.redirect("/inv")
    }

    const classificationSelect = await utilities.buildClassificationList(payload.classification_id)
    req.flash("notice", "Sorry, creating the vehicle failed.")
    return res.status(400).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationSelect,
      errors: null,
      ...payload,
    })
  } catch (err) {
    return next(err)
  }
}

/* ***************************
 * Return Inventory by Classification As JSON (AJAX)
 * Route: GET /inv/getInventory/:classification_id
 * ************************** */
exports.getInventoryJSON = async (req, res, next) => {
  try {
    const classification_id = parseInt(req.params.classification_id, 10)
    if (Number.isNaN(classification_id)) {
      const badReq = new Error("Invalid classification id")
      badReq.status = 400
      throw badReq
    }

    const raw = await invModel.getInventoryByClassificationId(classification_id)
    const invData = Array.isArray(raw) ? raw : raw?.rows || []
    return res.json(invData) // array (possibly empty)
  } catch (err) {
    return next(err)
  }
}

/* ***************************
 * Vehicle Detail Page
 * Route: GET /inv/detail/:inv_id
 * ************************** */
exports.buildDetail = async (req, res, next) => {
  try {
    const inv_id = parseInt(req.params.inv_id, 10)
    if (Number.isNaN(inv_id)) {
      const err = new Error("Invalid vehicle id")
      err.status = 400
      throw err
    }

    const vehicle = await invModel.getVehicleById(inv_id) // alias to getInventoryById
    if (!vehicle) {
      const err = new Error("Vehicle not found")
      err.status = 404
      throw err
    }

    const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`

    // Guard builder so a bad field can't 500 the page
    let vehicleDetail
    try {
      vehicleDetail = utilities.buildVehicleDetailHtml(vehicle)
    } catch (e) {
      console.error("buildVehicleDetailHtml error:", e, "vehicle=", vehicle)
      vehicleDetail = `
        <article class="vehicle-detail">
          <p><strong>${title}</strong></p>
          <p>${vehicle.inv_description || ""}</p>
        </article>
      `
    }

    const nav = await utilities.getNav(req, res, next)

    return res.render("inventory/detail", {
      title,
      nav,
      vehicleDetail, // must match the EJS variable name
      errors: null,
      notice: req.flash("notice"),
    })
  } catch (err) {
    return next(err)
  }
}

/* ***************************
 * Minimal detail (debug-only) — no partials/includes/helpers
 * Route: GET /inv/detail-min/:inv_id
 * ************************** */
exports.buildDetailMinimal = async (req, res, next) => {
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

    res.type("html").status(200).send(`
      <!doctype html>
      <meta charset="utf-8" />
      <title>${title} | Debug</title>
      <h1>${title}</h1>
      <p><strong>Make:</strong> ${vehicle.inv_make}</p>
      <p><strong>Model:</strong> ${vehicle.inv_model}</p>
      <p><strong>Year:</strong> ${vehicle.inv_year}</p>
      <p><strong>Price:</strong> ${vehicle.inv_price}</p>
      <p><strong>Miles:</strong> ${vehicle.inv_miles}</p>
      <p><strong>Color:</strong> ${vehicle.inv_color}</p>
      <p><strong>Class:</strong> ${vehicle.classification_name || ""}</p>
      <p><strong>Description:</strong> ${vehicle.inv_description || ""}</p>
      <p><img src="${vehicle.inv_image}" alt="${title}" style="max-width:480px;height:auto;" /></p>
      <hr />
      <p>If THIS renders, DB + controller are fine; any 500 on /inv/detail/:id comes from EJS/partials.</p>
    `)
  } catch (err) {
    return next(err)
  }
}

/* ***************************
 * Intentional 500 Error (Task 3)
 * Route: GET /inv/boom
 * ************************** */
exports.triggerBoom = async (_req, _res, _next) => {
  const err = new Error("Intentional server error for testing 500 flow")
  err.status = 500
  throw err
}
