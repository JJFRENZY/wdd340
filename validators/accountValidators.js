// validators/accountValidators.js
const { body } = require("express-validator");

const registerRules = [
  body("account_firstname")
    .trim()
    .notEmpty().withMessage("First name is required.")
    .isLength({ min: 2, max: 50 }).withMessage("First name must be 2–50 characters.")
    .escape(),

  body("account_lastname")
    .trim()
    .notEmpty().withMessage("Last name is required.")
    .isLength({ min: 2, max: 50 }).withMessage("Last name must be 2–50 characters.")
    .escape(),

  body("account_email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please enter a valid email.")
    .normalizeEmail(),

  body("account_password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 12 }).withMessage("Password must be at least 12 characters.")
    .matches(/[A-Z]/).withMessage("Password must include at least one uppercase letter.")
    .matches(/\d/).withMessage("Password must include at least one number.")
    .matches(/[^A-Za-z0-9]/).withMessage("Password must include at least one special character."),
];

module.exports = { registerRules };
