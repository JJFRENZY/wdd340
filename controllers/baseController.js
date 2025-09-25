// controllers/baseController.js
const utilities = require("../utilities/");

const baseController = {};

/* Home */
baseController.buildHome = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req, res, next);


    res.render("index", { title: "Home", nav });
  } catch (err) {
    next(err);
  }
};

module.exports = baseController;
