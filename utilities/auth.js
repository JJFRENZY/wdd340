// utilities/auth.js
const jwt = require("jsonwebtoken")

/**
 * attachJWT
 * Reads the JWT from the "jwt" cookie, verifies it, and exposes:
 *   - res.locals.loggedin (boolean)
 *   - res.locals.accountData (decoded payload or null)
 *
 * Safe and non-blocking: requests continue even when token is missing/invalid.
 * Requires cookie-parser to be mounted earlier in the chain.
 */
function attachJWT(req, res, next) {
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
  } catch (_err) {
    // Invalid or expired token: treat as logged out
    res.locals.loggedin = false
    res.locals.accountData = null
    return next()
  }
}

/**
 * issueJwt
 * Signs a JWT for the given payload (no password/hash!) and returns { token, cookieOptions }.
 * Use in your login controller, then set the cookie with res.cookie("jwt", token, cookieOptions).
 */
function issueJwt(payload, opts = {}) {
  const {
    expiresIn = "1h",
    cookieMaxAgeMs = 60 * 60 * 1000, // 1 hour
    cookiePath = "/",
  } = opts

  const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn })

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: cookieMaxAgeMs,
    path: cookiePath,
  }

  return { token, cookieOptions }
}

/**
 * clearJwt
 * Clears the jwt cookie (use in logout controller).
 */
function clearJwt(res, path = "/") {
  res.clearCookie("jwt", { path })
}

/**
 * (Optional) requireRole
 * Gate specific routes by role(s). Assumes attachJWT has already run.
 * Example: router.get("/admin", requireRole("Admin"), handler)
 */
function requireRole(...allowed) {
  return (req, res, next) => {
    const role = res.locals.accountData?.account_type
    if (role && allowed.includes(role)) return next()
    req.flash("notice", "You are not authorized to view that page.")
    return res.redirect("/account")
  }
}

module.exports = {
  attachJWT,
  issueJwt,
  clearJwt,
  requireRole, // optional
}
