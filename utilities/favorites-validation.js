// utilities/favorites-validation.js
// Validation & basic error handling for Favorites endpoints

const { body, validationResult } = require("express-validator");

const validate = {};

/**
 * itemRules
 * Validates that inv_id is a positive integer.
 */
validate.itemRules = () => [
  body("inv_id")
    .trim()
    .notEmpty().withMessage("Missing vehicle id.")
    .bail()
    .toInt()
    .isInt({ min: 1 }).withMessage("Invalid vehicle id."),
];

/**
 * checkItem
 * If validation fails, flash a notice and send the user back.
 */
validate.checkItem = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    req.flash("notice", first?.msg || "Invalid request.");
    // Prefer to go back to the referring page, otherwise home
    const back = req.get("referer") || "/";
    return res.redirect(back);
  }

  next();
};

module.exports = validate;
