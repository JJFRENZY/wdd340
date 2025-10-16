// middleware/jwtAuth.js
"use strict";

const jwt = require("jsonwebtoken");

/**
 * jwtAuth
 * Reads a JWT from either:
 *   - Cookie:   req.cookies.jwt
 *   - Header:   Authorization: Bearer <token>
 *
 * Verifies it with ACCESS_TOKEN_SECRET and exposes:
 *   - res.locals.loggedin   (boolean)
 *   - res.locals.accountData (object|null)
 *
 * Notes:
 * - Requires cookie-parser earlier in the middleware chain.
 * - ACCESS_TOKEN_SECRET must be set in your environment (Render: Env vars).
 * - This middleware NEVER throws; on any error it treats the user as logged out.
 */
module.exports = function jwtAuth(req, res, next) {
  // Default locals
  res.locals.loggedin = false;
  res.locals.accountData = null;

  // Prefer cookie, allow Authorization bearer as fallback (handy for API tools)
  const cookieToken = req.cookies && req.cookies.jwt;
  const headerAuth = req.get("authorization") || req.get("Authorization");
  const headerToken =
    headerAuth && /^Bearer\s+(.+)$/i.test(headerAuth) ? RegExp.$1.trim() : null;

  const token = cookieToken || headerToken;
  if (!token) return next();

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret || !secret.trim()) {
    // Secret misconfigured: fail closed but don't break the request
    // You might want to log this once at startup instead.
    return next();
  }

  try {
    // Small leeway to tolerate minor clock skew
    const options = { clockTolerance: 5 }; // seconds
    const decoded = jwt.verify(token, secret, options);

    // Optionally, you can sanity-check expected fields on decoded here.
    res.locals.loggedin = true;
    res.locals.accountData = decoded || null;
  } catch {
    // Any verification error -> treat as logged out
    res.locals.loggedin = false;
    res.locals.accountData = null;
  }
  return next();
};
