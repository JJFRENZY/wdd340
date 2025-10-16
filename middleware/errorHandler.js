// middleware/errorHandler.js
"use strict";

const isProd = String(process.env.NODE_ENV).toLowerCase() === "production";

module.exports = function errorHandler(err, req, res, _next) {
  const status = Number(err.status || err.statusCode || 500);
  const code = status >= 400 && status < 600 ? status : 500;

  // Log once for server operators
  console.error("[error]", {
    method: req.method,
    url: req.originalUrl || req.url,
    status: code,
    message: err.message,
    stack: isProd ? undefined : err.stack,
  });

  // Render error view if available; otherwise text fallback
  const viewData = {
    title: code === 500 ? "Server Error" : "Error",
    status: code,
    message: isProd && code === 500
      ? "Something went wrong. Please try again."
      : (err.message || "An error occurred."),
    // Optionally expose limited stack in dev
    stack: isProd ? null : err.stack,
  };

  try {
    return res.status(code).render("error", viewData);
  } catch {
    const body = isProd
      ? `${code} ${viewData.message}`
      : `${code}\n${viewData.message}\n\n${viewData.stack || ""}`;
    return res.status(code).type("text/plain").send(body);
  }
};
