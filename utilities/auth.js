// utilities/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Attach JWT payload (if present & valid) to res.locals for use in views.
 * Non-blocking: if missing/invalid, request continues without login state.
 */
function attachJWT(req, res, next) {
  const token = req.cookies && req.cookies.jwt;
  if (!token) return next();

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) {
      // Invalid/expired token — clear cookie and continue as logged out
      res.clearCookie("jwt");
      return next();
    }
    res.locals.accountData = payload;
    res.locals.loggedin = 1;
    next();
  });
}

module.exports = { attachJWT };
