// utilities/auth.js
"use strict";

const jwt = require("jsonwebtoken");

/** Internal: ensure secret exists */
function getSecret() {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("ACCESS_TOKEN_SECRET is not set");
  }
  return secret;
}

/** Build consistent cookie options for JWT cookies */
function buildCookieOptions({
  cookieMaxAgeMs = 60 * 60 * 1000, // 1 hour
  cookiePath = "/",
  sameSite = "lax",
  httpOnly = true,
  secure = String(process.env.NODE_ENV).toLowerCase() === "production",
} = {}) {
  return {
    httpOnly,
    sameSite,
    secure,
    maxAge: cookieMaxAgeMs,
    path: cookiePath,
  };
}

/**
 * issueJwt
 * Signs a JWT for the given payload (no password/hash!) and returns { token, cookieOptions }.
 * Usage:
 *   const { token, cookieOptions } = issueJwt(payload, { expiresIn: "1h" });
 *   res.cookie("jwt", token, cookieOptions);
 */
function issueJwt(payload, opts = {}) {
  const {
    expiresIn = "1h",
    cookieMaxAgeMs = 60 * 60 * 1000,
    cookiePath = "/",
  } = opts;

  // Shallow copy + minimal safety: do not allow password-like fields
  const unsafeKeys = ["password", "pass", "hash", "account_password"];
  for (const k of unsafeKeys) {
    if (Object.prototype.hasOwnProperty.call(payload || {}, k)) {
      throw new Error(`Refusing to sign unsafe field "${k}" in JWT payload`);
    }
  }

  const token = jwt.sign(payload || {}, getSecret(), { expiresIn });
  const cookieOptions = buildCookieOptions({ cookieMaxAgeMs, cookiePath });
  return { token, cookieOptions };
}

/**
 * rotateJwt
 * Re-issue a new JWT from a payload (handy after profile edits).
 * Same return shape as issueJwt.
 */
function rotateJwt(payload, opts = {}) {
  return issueJwt(payload, opts);
}

/**
 * clearJwt
 * Clears the "jwt" cookie (use in logout controller).
 */
function clearJwt(res, path = "/") {
  res.clearCookie("jwt", { path });
}

/* -----------------------------------------------------------
 * Authorization helpers
 * --------------------------------------------------------- */

/** True if the request *prefers* JSON (API clients). */
function wantsJson(req) {
  try {
    const preferred = req.accepts(["html", "json"]);
    if (preferred === "json") return true;
  } catch (_) {}
  return Boolean(req.xhr) ||
    /application\/json/i.test(req.get("accept") || "") ||
    /application\/json/i.test(req.get("content-type") || "");
}

/**
 * requireAuth()
 * Enforce that jwtAuth has set res.locals.loggedin.
 */
function requireAuth() {
  return (req, res, next) => {
    if (res.locals && res.locals.loggedin) return next();

    // Preserve destination for post-login redirect (GET only)
    try {
      if (req.session && req.method === "GET") {
        req.session.returnTo = req.originalUrl || req.url;
      }
    } catch (_) {}

    if (wantsJson(req)) {
      return res.status(401).json({ ok: false, message: "Please log in to continue." });
    }
    if (typeof req.flash === "function") {
      req.flash("notice", "Please log in to continue.");
    }
    return res.redirect("/account/login");
  };
}

/**
 * requireRole(...allowed)
 * Gate specific routes by role(s). Case-insensitive match.
 * Assumes jwtAuth has already populated res.locals.accountData/account_type.
 *
 * Example:
 *   router.get("/admin", requireRole("Admin"), handler)
 *   router.use("/inv", requireRole("Employee", "Admin"), invRouter)
 */
function requireRole(...allowed) {
  // Normalize once
  const allow = (allowed.length ? allowed : ["Admin"]).map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    const role = String(res.locals?.accountData?.account_type || "").toLowerCase();
    const loggedin = !!res.locals?.loggedin;

    if (loggedin && allow.includes(role)) return next();

    // Save intended path (GET only)
    try {
      if (req.session && req.method === "GET") {
        req.session.returnTo = req.originalUrl || req.url;
      }
    } catch (_) {}

    const status = loggedin ? 403 : 401;
    const msg = loggedin
      ? "You are not authorized to view that page."
      : "Please log in to continue.";

    if (wantsJson(req)) {
      return res.status(status).json({ ok: false, message: msg });
    }
    if (typeof req.flash === "function") {
      req.flash("notice", msg);
    }
    return res.redirect("/account/login");
  };
}

module.exports = {
  // JWT helpers
  issueJwt,
  rotateJwt,
  clearJwt,
  buildCookieOptions,

  // AuthZ gates
  requireAuth,
  requireRole,
};
