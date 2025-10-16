// utilities/asyncHandler.js
"use strict";

/**
 * Wrap an async Express handler so rejections & throws go to next(err).
 * Usage:
 *   const ah = require("../utilities/asyncHandler");
 *   router.get("/route", ah(async (req, res) => { ... }));
 *
 * Works for both async functions and sync functions that might throw.
 */
module.exports = function asyncHandler(fn) {
  const name = fn && fn.name ? `asyncHandler(${fn.name})` : "asyncHandler";
  function wrapped(req, res, next) {
    try {
      return Promise.resolve(fn(req, res, next)).catch(next);
    } catch (err) {
      return next(err);
    }
  }
  Object.defineProperty(wrapped, "name", { value: name });
  return wrapped;
};
