// utilities/account-validation.js
const utilities = require(".");
const { body, validationResult } = require("express-validator");

const validate = {};

/* **********************************
 *  Registration Data Validation Rules
 * ********************************* */
// Accept either spelling to avoid typos in routes:
validate.registrationRules =
validate.registationRules = () => {
  return [
    // First name
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    // Last name
    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),

    // Email
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),

    // Password (strong)
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
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    let nav = "";
    try {
      nav = await utilities.getNav(req, res, next);
    } catch (_) {}

    return res.status(400).render("account/register", {
      title: "Register",
      nav,
      errors, // express-validator result object
      // stickiness (do NOT return password)
      account_firstname,
      account_lastname,
      account_email,
    });
  }

  next();
};

module.exports = validate;
