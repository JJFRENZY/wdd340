// middleware/requireEmployee.js
// Allow only Employee/Admin accounts into inventory admin flows.
// Assumes jwtAuth already populated res.locals.loggedin and res.locals.accountData.

module.exports = function requireEmployee(req, res, next) {
  const { loggedin, accountData } = res.locals || {};
  if (loggedin && accountData && (accountData.account_type === "Employee" || accountData.account_type === "Admin")) {
    return next();
  }
  req.flash("notice", "You must be logged in as an Employee or Admin to access that.");
  return res.redirect("/account/login");
};
