// middleware/requireRole.js
// Gate employee/admin areas using data set by jwtAuth (res.locals.accountData)

function requireEmployeeOrAdmin(req, res, next) {
  const acct = res.locals.accountData;
  const isElevated =
    acct && (acct.account_type === "Employee" || acct.account_type === "Admin");

  if (isElevated) return next();

  // Remember where they were headed so we can return them after login
  try {
    if (req.session) req.session.returnTo = req.originalUrl;
  } catch (_) {}

  const wantsJSON =
    req.accepts(["html", "json"]) === "json" ||
    req.get("X-Requested-With") === "XMLHttpRequest";

  const msg = acct
    ? "You don't have permission to access that page."
    : "Please log in to continue.";

  if (wantsJSON) {
    return res.status(acct ? 403 : 401).json({ ok: false, message: msg });
  }

  req.flash("notice", msg);
  return res.redirect("/account/login");
}

module.exports = { requireEmployeeOrAdmin };
