// middleware/requireRole.js
// Gate protected areas using data set by jwtAuth (res.locals.loggedin/accountData).
// Exports:
//   - requireRole(roles): roles = string | string[]
//   - requireEmployeeOrAdmin: shortcut for ["Employee","Admin"]

"use strict";

/** True if the client prefers/accepts JSON. */
function wantsJson(req) {
  try {
    const preferred = req.accepts(["html", "json"]);
    if (preferred === "json") return true;
  } catch (_) {}
  // Heuristics / fallbacks
  return Boolean(req.xhr) ||
    /application\/json/i.test(req.get("accept") || "") ||
    /application\/json/i.test(req.get("content-type") || "");
}

/** Case-insensitive role check against one or more allowed roles. */
function hasAllowedRole(accountData, roles) {
  if (!accountData || !accountData.account_type) return false;
  const userRole = String(accountData.account_type).toLowerCase();
  const norm = Array.isArray(roles) ? roles : [roles];
  return norm.some((r) => String(r).toLowerCase() === userRole);
}

/**
 * Factory: requireRole(roles)
 * Usage:
 *   app.use("/admin", requireRole(["Admin"]))
 *   app.use("/inv", requireRole(["Employee","Admin"]))
 */
function requireRole(roles) {
  return function (req, res, next) {
    const { loggedin, accountData } = res.locals || {};

    // Authn vs Authz messages & codes
    const isAuthed = !!loggedin;
    const allowed = hasAllowedRole(accountData, roles);

    if (isAuthed && allowed) return next();

    // Remember where they were headed so we can return them after login
    try {
      if (req.session && req.method === "GET") {
        req.session.returnTo = req.originalUrl || req.url;
      }
    } catch (_) {}

    const unauthMsg = "Please log in to continue.";
    const forbiddenMsg = "You don't have permission to access that page.";
    const msg = isAuthed ? forbiddenMsg : unauthMsg;
    const status = isAuthed ? 403 : 401;

    if (wantsJson(req)) {
      return res.status(status).json({ ok: false, message: msg });
    }

    if (typeof req.flash === "function") {
      req.flash("notice", msg);
    }
    return res.redirect("/account/login");
  };
}

/** Shortcut for the common case: Employee or Admin. */
const requireEmployeeOrAdmin = requireRole(["Employee", "Admin"]);

module.exports = { requireRole, requireEmployeeOrAdmin };
