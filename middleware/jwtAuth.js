// middleware/jwtAuth.js
const jwt = require("jsonwebtoken")

/**
 * jwtAuth
 * Reads the JWT from the "jwt" cookie, verifies it, and exposes:
 *   - res.locals.loggedin (boolean)
 *   - res.locals.accountData (decoded payload or null)
 *
 * Notes:
 * - Requires cookie-parser earlier in the middleware chain.
 * - ACCESS_TOKEN_SECRET must be set in your environment.
 */
module.exports = function jwtAuth(req, res, next) {
  const token = req.cookies?.jwt
  if (!token) {
    res.locals.loggedin = false
    res.locals.accountData = null
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    res.locals.loggedin = true
    res.locals.accountData = decoded
    return next()
  } catch (err) {
    // Token invalid or expired: treat as logged out
    res.locals.loggedin = false
    res.locals.accountData = null
    return next()
  }
}
