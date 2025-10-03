// utilities/inv-validation.js
// Server-side validation & sanitization for Inventory flows
// Uses express-validator. Also rebuilds sticky form data on error.

const utilities = require("./index"); // utilities/index.js (explicit is clearer)
const { body, validationResult } = require("express-validator");

const validate = {};

/* **********************************
 *  Add Classification: rules
 *  - letters only (no spaces/symbols)
 * ********************************* */
validate.classificationRules = () => [
  body("classification_name")
    .trim()
    .escape()
    .notEmpty().withMessage("Please provide a classification name.")
    .bail()
    .isLength({ min: 2 }).withMessage("Classification name must be at least 2 characters.")
    .bail()
    .matches(/^[A-Za-z]+$/).withMessage("Letters only (no spaces or special characters)."),
];

/* ******************************
 * Check classification data
 * If errors, re-render add-classification with messages
 * ***************************** */
validate.checkClassificationData = async (req, res, next) => {
  const { classification_name } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav(req, res, next);
    return res.status(400).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors,
      notice: req.flash("notice"),
      classification_name: classification_name || "", // sticky
    });
  }
  next();
};

/* **********************************
 *  Add Inventory: rules
 *  - include type coercion (.toInt/.toFloat)
 * ********************************* */
validate.inventoryRules = () => {
  const thisYear = new Date().getFullYear();
  return [
    body("classification_id")
      .trim()
      .notEmpty().withMessage("Please choose a classification.")
      .bail()
      .toInt()
      .isInt({ min: 1 }).withMessage("Classification is invalid."),

    body("inv_make")
      .trim()
      .escape()
      .notEmpty().withMessage("Please provide a make.")
      .isLength({ max: 50 }).withMessage("Make must be 50 characters or fewer."),

    body("inv_model")
      .trim()
      .escape()
      .notEmpty().withMessage("Please provide a model.")
      .isLength({ max: 50 }).withMessage("Model must be 50 characters or fewer."),

    body("inv_year")
      .trim()
      .notEmpty().withMessage("Please provide a year.")
      .bail()
      .toInt()
      .isInt({ min: 1886, max: thisYear + 1 })
      .withMessage(`Year must be a 4-digit year between 1886 and ${thisYear + 1}.`),

    body("inv_description")
      .trim()
      .notEmpty().withMessage("Please provide a description.")
      .isLength({ min: 5 }).withMessage("Description must be at least 5 characters.")
      .escape(),

    body("inv_image")
      .trim()
      .notEmpty().withMessage("Please provide an image path (e.g., /images/vehicles/no-image.png)."),

    body("inv_thumbnail")
      .trim()
      .notEmpty().withMessage("Please provide a thumbnail path (e.g., /images/vehicles/no-image-tn.png)."),

    body("inv_price")
      .trim()
      .notEmpty().withMessage("Please provide a price.")
      .bail()
      .toFloat()
      .isFloat({ min: 0 }).withMessage("Price must be a positive number."),

    body("inv_miles")
      .trim()
      .notEmpty().withMessage("Please provide mileage.")
      .bail()
      .toInt()
      .isInt({ min: 0 }).withMessage("Mileage must be zero or greater."),

    body("inv_color")
      .trim()
      .escape()
      .notEmpty().withMessage("Please provide a color.")
      .isLength({ max: 30 }).withMessage("Color must be 30 characters or fewer."),
  ];
};

/* **********************************
 *  Update Inventory: rules
 *  - require inv_id (int) + reuse inventory rules
 * ********************************* */
validate.updateRules = () => [
  body("inv_id")
    .trim()
    .notEmpty().withMessage("Missing item id.")
    .bail()
    .toInt()
    .isInt({ min: 1 }).withMessage("Invalid item id."),
  // Reuse all the add-inventory rules
  ...validate.inventoryRules(),
];

/* ******************************
 * Check inventory data (ADD)
 * If errors, rebuild classification select & re-render add-inventory
 * ***************************** */
validate.checkInventoryData = async (req, res, next) => {
  const {
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id,
  } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav(req, res, next);

    // Build the select with the previously chosen classification (stickiness)
    let classificationSelect = "";
    try {
      classificationSelect = await utilities.buildClassificationList(classification_id);
    } catch (e) {
      console.error("Failed to build classification select:", e.message || e);
      classificationSelect =
        '<select id="classificationList" name="classification_id" required>' +
        "<option value=''>Choose a Classification</option>" +
        "</select>";
    }

    return res.status(400).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      errors,
      notice: req.flash("notice"),

      // dynamic select
      classificationSelect,

      // sticky values
      inv_make: inv_make || "",
      inv_model: inv_model || "",
      inv_year: inv_year || "",
      inv_description: inv_description || "",
      inv_image: inv_image || "",
      inv_thumbnail: inv_thumbnail || "",
      inv_price: inv_price || "",
      inv_miles: inv_miles || "",
      inv_color: inv_color || "",
      classification_id: classification_id || "",
    });
  }

  next();
};

/* ******************************
 * Check update data (EDIT)
 * If errors, rebuild classification select & re-render edit-inventory
 * ***************************** */
validate.checkUpdateData = async (req, res, next) => {
  const {
    inv_id,
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id,
  } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav(req, res, next);

    // Rebuild the classification select with stickiness
    let classificationSelect = "";
    try {
      classificationSelect = await utilities.buildClassificationList(classification_id);
    } catch (e) {
      console.error("Failed to build classification select:", e.message || e);
      classificationSelect =
        '<select id="classificationList" name="classification_id" required>' +
        "<option value=''>Choose a Classification</option>" +
        "</select>";
    }

    const itemName = `${inv_year || ""} ${inv_make || ""} ${inv_model || ""}`.trim();

    return res.status(400).render("inventory/edit-inventory", {
      title: itemName ? `Edit ${itemName}` : "Edit Vehicle",
      nav,
      errors,
      notice: req.flash("notice"),
      classificationSelect,

      // sticky fields (including inv_id!)
      inv_id: inv_id || "",
      inv_make: inv_make || "",
      inv_model: inv_model || "",
      inv_year: inv_year || "",
      inv_description: inv_description || "",
      inv_image: inv_image || "",
      inv_thumbnail: inv_thumbnail || "",
      inv_price: inv_price || "",
      inv_miles: inv_miles || "",
      inv_color: inv_color || "",
      classification_id: classification_id || "",
    });
  }

  next();
};

module.exports = validate;
