// utilities/account-validation.js
const utilities = require("."); // for getNav in error render
const { body, validationResult } = require("express-validator");
const accountModel = require("../models/account-model");

const validate = {};

/*  **********************************
 *  Registration Data Validation Rules
 * ********************************* */
function registrationRules() {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),

    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email);
        if (emailExists) {
          throw new Error("Email exists. Please log in or use a different email.");
        }
      }),

    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ];
}
validate.registrationRules = registrationRules; // correct spelling
validate.registationRules = registrationRules;   // keep legacy spelling

/* ******************************
 * Check registration data and return errors or continue
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav(req, res, next);
    return res.status(400).render("account/register", {
      title: "Register",
      nav,
      errors,
      account_firstname,
      account_lastname,
      account_email,
    });
  }
  next();
};

/*  **********************************
 *  Login Data Validation Rules
 * ********************************* */
validate.loginRules = () => [
  body("account_email").trim().isEmail().normalizeEmail().withMessage("Please enter a valid email address."),
  body("account_password")
    .trim()
    .notEmpty()
    .isStrongPassword({
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage("Password must be at least 12 chars and include upper, lower, number, and symbol."),
];

/* ******************************
 * Check login data and return errors or continue
 * ***************************** */
validate.checkLoginData = async (req, res, next) => {
  const { account_email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav(req, res, next);
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors,
      account_email, // sticky email
    });
  }
  next();
};

/* ==========================================
 * Task 5: Account Update (names + email)
 * ========================================== */
validate.updateAccountRules = () => [
  body("account_id")
    .trim()
    .notEmpty()
    .withMessage("Missing account id.")
    .bail()
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Invalid account id."),

  body("account_firstname")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("First name is required.")
    .bail()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be 1–50 characters."),

  body("account_lastname")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Last name is required.")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2–50 characters."),

  body("account_email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("A valid email is required.")
    .bail()
    .custom(async (email, { req }) => {
      const currentId = parseInt(req.body.account_id, 10);

      // Prefer a precise lookup if the model provides it
      if (typeof accountModel.getAccountByEmail === "function") {
        const existing = await accountModel.getAccountByEmail(email);
        if (existing && Number(existing.account_id) !== Number(currentId)) {
          throw new Error("Email already in use by another account.");
        }
      } else {
        // Fallback: basic existence check (may flag unchanged email—best effort)
        const exists = await accountModel.checkExistingEmail(email);
        if (exists) {
          throw new Error("Email already in use.");
        }
      }
      return true;
    }),
];

/* Return to update view with sticky values if there are errors */
validate.checkUpdateAccountData = async (req, res, next) => {
  const { account_id, account_firstname, account_lastname, account_email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav(req, res, next);
    return res.status(400).render("account/update", {
      title: "Update Account",
      nav,
      errors,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    });
  }
  next();
};

/* ==========================================
 * Task 5: Password Change
 * ========================================== */
validate.updatePasswordRules = () => [
  body("account_id")
    .trim()
    .notEmpty()
    .withMessage("Missing account id.")
    .bail()
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Invalid account id."),

  body("account_password")
    .trim()
    .notEmpty()
    .withMessage("Please enter a new password.")
    .bail()
    .isStrongPassword({
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage("Password does not meet requirements (12+ chars incl. upper, lower, number, symbol)."),
];

/* Return to update view if password validation fails */
validate.checkUpdatePasswordData = async (req, res, next) => {
  const { account_id } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav(req, res, next);

    // Try to repopulate the account info form with current values
    let acct = null;
    try {
      if (typeof accountModel.getAccountById === "function") {
        acct = await accountModel.getAccountById(Number(account_id));
      }
    } catch (_) {}

    return res.status(400).render("account/update", {
      title: "Update Account",
      nav,
      errors,
      account_id,
      account_firstname: acct?.account_firstname || "",
      account_lastname:  acct?.account_lastname  || "",
      account_email:     acct?.account_email     || "",
    });
  }
  next();
};

module.exports = validate;
