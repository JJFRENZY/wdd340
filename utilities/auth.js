// utilities/auth.js  (UPDATED: helpers only, no attachJWT)
const jwt = require("jsonwebtoken")

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

  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not set")
  }

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
 * Gate specific routes by role(s). Assumes jwtAuth has already run.
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
  issueJwt,
  clearJwt,
  requireRole, // optional
}
