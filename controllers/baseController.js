// controllers/baseController.js
const utilities = require("../utilities/");

const baseController = {};

/* Home */
baseController.buildHome = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);

    // TEMP: verify sessions/flash are wired up.
    // Remove this after you confirm it shows on the home page.
    req.flash("notice", "This is a flash message from Home.");

    res.render("index", { title: "Home", nav });
  } catch (err) {
    next(err);
  }
};

module.exports = baseController;
