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
        const emailExists = await accountModel.getAccountByEmail(account_email);
        if (emailExists) {
          throw new Error("Email exists. Please log in or use a different email.");
        }
        return true;
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
// support both spellings
validate.registrationRules = registrationRules;
validate.registationRules = registrationRules;

/* ******************************
 * Check registration data and return errors or continue
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
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
validate.loginRules = () => {
  return [
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address."),
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
      .withMessage(
        "Password must be at least 12 chars and include upper, lower, number, and symbol."
      ),
  ];
};

/* ******************************
 * Check login data and return errors or continue
 * ***************************** */
validate.checkLoginData = async (req, res, next) => {
  const { account_email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors,
      account_email, // sticky email
    });
  }
  next();
};

/*  **********************************
 *  Update Account (name/email) Validation Rules
 * ********************************* */
validate.updateAccountRules = () => {
  return [
    body("account_id")
      .trim()
      .toInt()
      .isInt({ min: 1 })
      .withMessage("Invalid account id."),

    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
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
      .custom(async (email, { req }) => {
        // Ensure email is unique across other accounts
        const existing = await accountModel.getAccountByEmail(email);
        const thisId = Number(req.body.account_id);
        if (existing && Number(existing.account_id) !== thisId) {
          throw new Error("Email exists. Please use a different email.");
        }
        return true;
      }),
  ];
};

/* ******************************
 * Check update account data
 * ***************************** */
validate.checkUpdateAccountData = async (req, res, next) => {
  const { account_id, account_firstname, account_lastname, account_email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
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

/*  **********************************
 *  Update Password Validation Rules
 * ********************************* */
validate.updatePasswordRules = () => {
  return [
    body("account_id")
      .trim()
      .toInt()
      .isInt({ min: 1 })
      .withMessage("Invalid account id."),

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
};

/* ******************************
 * Check update password data
 *  - Re-renders update view with sticky non-password fields
 * ***************************** */
validate.checkUpdatePasswordData = async (req, res, next) => {
  const { account_id } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    // Pull account basics to rehydrate the update view
    let acct = null;
    try {
      acct = await accountModel.getAccountById(Number(account_id));
    } catch (_) {}

    return res.status(400).render("account/update", {
      title: "Update Account",
      nav,
      errors,
      account_id,
      account_firstname: acct?.account_firstname || "",
      account_lastname: acct?.account_lastname || "",
      account_email: acct?.account_email || "",
    });
  }
  next();
};

module.exports = validate;
