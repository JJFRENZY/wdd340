// controllers/invController.js
const invModel = require("../models/inventory-model");
const utilities = require("../utilities");

const invCont = {};

/* ***************************
 * Management landing (GET /inv)
 *************************** */
invCont.buildManagement = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    res.render("inventory/management", {
      title: "Inventory Management",
      nav,
      errors: null,
    });
  } catch (err) {
    next(err);
  }
};

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

    const detailHtml = utilities.buildVehicleDetailHtml(vehicle);
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
 * Intentional 500 error (test)
 * /inv/boom
 *************************** */
invCont.triggerBoom = async function (_req, _res, next) {
  try {
    const e = new Error("Intentional 500 test error");
    e.status = 500;
    throw e;
  } catch (err) {
    next(err);
  }
};

/* ***************************
 * Add Classification (GET)
 * /inv/add-classification
 *************************** */
invCont.buildAddClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    res.render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors: null,
      classification_name: "",
    });
  } catch (err) {
    next(err);
  }
};

/* ***************************
 * Add Classification (POST)
 *************************** */
invCont.addClassification = async function (req, res, next) {
  try {
    const { classification_name } = req.body;
    const inserted = await invModel.addClassification(classification_name);

    if (inserted && inserted.classification_id) {
      req.flash("success", `Added classification: ${inserted.classification_name}`);
      const nav = await utilities.getNav(); // refresh nav to include new classification
      return res.status(201).render("inventory/management", {
        title: "Inventory Management",
        nav,
        errors: null,
      });
      // (You could also: res.redirect("/inv") if you prefer PRG)
    }

    // fallback failure
    const nav = await utilities.getNav();
    req.flash("error", "Sorry, adding classification failed.");
    return res.status(500).render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors: null,
      classification_name,
    });
  } catch (err) {
    next(err);
  }
};

/* ***************************
 * Add Inventory (GET)
 * /inv/add-inventory
 *************************** */
invCont.buildAddInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);
    const classificationSelect = await utilities.buildClassificationList(null);
    res.render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      errors: null,
      classificationSelect,

      // empty sticky defaults
      inv_make: "",
      inv_model: "",
      inv_year: "",
      inv_description: "",
      inv_image: "/images/vehicles/no-image.png",
      inv_thumbnail: "/images/vehicles/no-image-tn.png",
      inv_price: "",
      inv_miles: "",
      inv_color: "",
    });
  } catch (err) {
    next(err);
  }
};

/* ***************************
 * Add Inventory (POST)
 *************************** */
invCont.addInventory = async function (req, res, next) {
  try {
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
    };

    const inserted = await invModel.addInventory(payload);

    if (inserted && inserted.inv_id) {
      req.flash("success", `Added vehicle: ${inserted.inv_year} ${inserted.inv_make} ${inserted.inv_model}`);
      const nav = await utilities.getNav(); // show updated nav
      return res.status(201).render("inventory/management", {
        title: "Inventory Management",
        nav,
        errors: null,
      });
      // (Alternatively: res.redirect("/inv"))
    }

    // failure fallback: rebuild select and re-render with sticky values
    const nav = await utilities.getNav();
    const classificationSelect = await utilities.buildClassificationList(payload.classification_id);
    req.flash("error", "Sorry, adding the vehicle failed.");
    return res.status(500).render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      errors: null,
      classificationSelect,
      ...payload,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = invCont;
