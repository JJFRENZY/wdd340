// controllers/baseController.js
"use strict";

// If you still need utilities for other helpers, keep this require.
// (Not needed for nav anymore since it's injected by nav middleware.)
const utilities = require("../utilities");

const baseController = {};

/* ****************************************
 *  Home
 * **************************************** */
baseController.buildHome = async function (_req, res, next) {
  try {
    // nav is provided by middleware/nav.js -> res.locals.nav
    return res.render("index", {
      title: "Home",
      nav: res.locals.nav || ""
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = baseController;
