// utilities/favorites-validation.js
// Validation & basic error handling for Favorites endpoints
"use strict";

const { body, validationResult } = require("express-validator");

const validate = {};

/* ----------------------------------------
 * Helpers
 * -------------------------------------- */
function wantsJson(req) {
  try {
    const preferred = req.accepts(["html", "json"]);
    if (preferred === "json") return true;
  } catch (_) {}
  return Boolean(req.xhr) ||
    /application\/json/i.test(req.get("accept") || "") ||
    /application\/json/i.test(req.get("content-type") || "");
}

function backTarget(req, fallback = "/") {
  return req.get("referer") || req.get("referrer") || fallback;
}

/**
 * itemRules
 * Validates that inv_id is a positive integer.
 */
validate.itemRules = () => [
  body("inv_id")
    .trim()
    .notEmpty()
    .withMessage("Missing vehicle id.")
    .bail()
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Invalid vehicle id."),
];

/**
 * checkItem
 * If validation fails:
 *  - HTML: flash a notice and redirect back (or /)
 *  - JSON: 400 with the first error message
 */
validate.checkItem = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    const message = first?.msg || "Invalid request.";

    if (wantsJson(req)) {
      return res.status(400).json({
        ok: false,
        message,
        errors: errors.array().map((e) => ({
          field: e.param,
          msg: e.msg,
        })),
      });
    }

    if (typeof req.flash === "function") {
      req.flash("notice", message);
    }
    return res.redirect(backTarget(req));
  }

  next();
};

module.exports = validate;
