// middleware/securityHeaders.js
"use strict";

module.exports = function securityHeaders(_req, res, next) {
  // Basic hardening
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Keep a relaxed CSP since you have inline scripts; tighten later if you remove inline
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'");
  next();
};
