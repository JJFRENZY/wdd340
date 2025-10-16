// middleware/nav.js
"use strict";
const utilities = require("../utilities");

module.exports = async function navMiddleware(req, res, next) {
  try {
    res.locals.nav = await utilities.getNav(req, res, next);
  } catch (e) {
    console.error("[nav] getNav failed:", e.message || e);
    res.locals.nav = ""; // partial shows fallback
  }
  next();
};
