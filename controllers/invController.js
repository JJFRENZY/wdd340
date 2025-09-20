// controllers/invController.js
const invModel = require("../models/inventory-model");
const utilities = require("../utilities");

const invCont = {};

/* ***************************
 * Build inventory by classification view
 * /inv/type/:classificationId
 *************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  try {
    const classification_id = req.params.classificationId;
    const data = await invModel.getInventoryByClassificationId(classification_id);
    const grid = await utilities.buildClassificationGrid(data);
    const nav = await utilities.getNav(req, res, next);
    const className = data?.[0]?.classification_name || "Selected";
    res.render("./inventory/classification", {
      title: `${className} vehicles`,
      nav,
      grid,
    });
  } catch (err) {
    next(err);
  }
};

/* ***************************
 * Build single-vehicle detail view
 * /inv/detail/:inv_id
 *************************** */
invCont.buildDetail = async function (req, res, next) {
  try {
    const invId = Number(req.params.inv_id);
    if (!Number.isInteger(invId) || invId <= 0) {
      const e = new Error("Invalid vehicle id");
      e.status = 400;
      throw e;
    }

    const vehicle = await invModel.getInventoryById(invId);
    const nav = await utilities.getNav(req, res, next);

    if (!vehicle) {
      return res.status(404).render("errors/error", {
        title: 404,
        message: "Vehicle not found.",
        nav,
      });
    }

    const detailHtml = utilities.buildVehicleDetailHtml(vehicle); // util builds responsive HTML block
    res.render("./inventory/detail", {
      title: `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`,
      nav,
      detailHtml,
    });
  } catch (err) {
    next(err);
  }
};

/* ***************************
 * Intentional 500 error (Task 3)
 * /inv/boom
 *************************** */
invCont.triggerBoom = async function (req, res, next) {
  try {
    const e = new Error("Intentional 500 test error");
    e.status = 500;
    throw e;
  } catch (err) {
    next(err);
  }
};

module.exports = invCont;
