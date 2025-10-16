// middleware/requireEmployee.js
// Allow only Employee/Admin accounts into inventory admin flows.
// Assumes jwtAuth already populated res.locals.loggedin and res.locals.accountData.

"use strict";

/**
 * Determine if the incoming request expects JSON.
 * Prefers Accept negotiation; also considers XHR.
 */
function wantsJson(req) {
  try {
    const preferred = req.accepts(["html", "json"]);
    if (preferred === "json") return true;
  } catch (_) {
    /* ignore */
  }
  // Fallback heuristics
  return Boolean(req.xhr) ||
         /application\/json/i.test(req.get("content-type") || "") ||
         /application\/json/i.test(req.get("accept") || "");
}

/**
 * Case-insensitive role match.
 */
function hasAllowedRole(accountData, allowed = ["Employee", "Admin"]) {
  if (!accountData || !accountData.account_type) return false;
  const userRole = String(accountData.account_type).toLowerCase();
  return allowed.some((r) => String(r).toLowerCase() === userRole);
}

/**
 * Middleware: require Employee or Admin.
 */
module.exports = function requireEmployee(req, res, next) {
  const { loggedin, accountData } = res.locals || {};

  if (loggedin && hasAllowedRole(accountData, ["Employee", "Admin"])) {
    return next();
  }

  // Not authorized
  if (wantsJson(req)) {
    return res.status(403).json({
      error: "forbidden",
      message: "You must be logged in as an Employee or Admin to access that."
    });
  }

  // HTML flow: flash + redirect (if flash is available)
  if (typeof req.flash === "function") {
    req.flash("notice", "You must be logged in as an Employee or Admin to access that.");
  }
  return res.redirect("/account/login");
};
