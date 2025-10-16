// middleware/enforceHttps.js
"use strict";

const isProd = String(process.env.NODE_ENV).toLowerCase() === "production";

module.exports = function enforceHttps(req, res, next) {
  if (!isProd) return next();

  // Behind a proxy (Render), trust x-forwarded-proto
  const proto = (req.headers["x-forwarded-proto"] || "").toLowerCase();
  if (proto === "https") return next();

  // Preserve path & query
  const host = req.headers.host;
  const url = "https://" + host + req.originalUrl;
  return res.redirect(301, url);
};
