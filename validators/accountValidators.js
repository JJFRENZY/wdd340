"use strict";

const { body } = require("express-validator");
const accountModel = require("../models/account-model");

/**
 * Registration rules
 * - First/Last name length & required
 * - Valid email & not already in use
 * - Strong password (12+ incl upper/lower/number/symbol)
 * - Optional: confirm password field (account_password_confirm)
 */
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
    .normalizeEmail()
    .custom(async (email) => {
      // Ensure email is not already registered
      if (typeof accountModel.checkExistingEmail === "function") {
        const exists = await accountModel.checkExistingEmail(email);
        if (exists) {
          throw new Error("Email exists. Please log in or use a different email.");
        }
      }
      return true;
    }),

  body("account_password")
    .trim()
    .notEmpty().withMessage("Password is required.")
    .isStrongPassword({
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage("Password must be 12+ chars and include upper, lower, number, and symbol."),

  // Optional confirm password support if your form includes it
  body("account_password_confirm")
    .optional({ checkFalsy: true })
    .custom((val, { req }) => {
      if (val !== req.body.account_password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
];

/**
 * Login rules
 * - Valid email (format) and a non-empty password.
 * - Do NOT enforce strong password at login.
 */
const loginRules = [
  body("account_email")
    .trim()
    .isEmail().withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("account_password")
    .trim()
    .notEmpty().withMessage("Please enter your password."),
];

/**
 * Update account (name + email)
 * - Same name constraints as registration
 * - Email must be valid and not used by someone else
 */
const updateAccountRules = [
  body("account_id")
    .trim()
    .notEmpty().withMessage("Missing account id.")
    .bail()
    .toInt()
    .isInt({ min: 1 }).withMessage("Invalid account id."),

  body("account_firstname")
    .trim()
    .notEmpty().withMessage("First name is required.")
    .isLength({ min: 1, max: 50 }).withMessage("First name must be 1–50 characters.")
    .escape(),

  body("account_lastname")
    .trim()
    .notEmpty().withMessage("Last name is required.")
    .isLength({ min: 2, max: 50 }).withMessage("Last name must be 2–50 characters.")
    .escape(),

  body("account_email")
    .trim()
    .isEmail().withMessage("A valid email is required.")
    .normalizeEmail()
    .custom(async (email, { req }) => {
      const currentId = parseInt(req.body.account_id, 10);
      // Prefer precise lookup if available
      if (typeof accountModel.getAccountByEmail === "function") {
        const existing = await accountModel.getAccountByEmail(email);
        if (existing && Number(existing.account_id) !== Number(currentId)) {
          throw new Error("Email already in use by another account.");
        }
      } else if (typeof accountModel.checkExistingEmail === "function") {
        const exists = await accountModel.checkExistingEmail(email);
        if (exists) {
          throw new Error("Email already in use.");
        }
      }
      return true;
    }),
];

/**
 * Update password
 * - Requires account_id
 * - Strong password (12+ incl upper/lower/number/symbol)
 * - Optional confirm
 */
const updatePasswordRules = [
  body("account_id")
    .trim()
    .notEmpty().withMessage("Missing account id.")
    .bail()
    .toInt()
    .isInt({ min: 1 }).withMessage("Invalid account id."),

  body("account_password")
    .trim()
    .notEmpty().withMessage("Please enter a new password.")
    .isStrongPassword({
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage("Password must be 12+ chars and include upper, lower, number, and symbol."),

  body("account_password_confirm")
    .optional({ checkFalsy: true })
    .custom((val, { req }) => {
      if (val !== req.body.account_password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
];

module.exports = {
  registerRules,
  loginRules,
  updateAccountRules,
  updatePasswordRules,
};
