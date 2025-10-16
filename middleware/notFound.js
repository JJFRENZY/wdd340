// middleware/notFound.js
"use strict";

module.exports = function notFound(req, res, _next) {
  const status = 404;
  // If you have views/error.ejs, render it:
  try {
    return res.status(status).render("error", {
      title: "Not Found",
      status,
      message: "The page you’re looking for wasn’t found.",
    });
  } catch {
    // Fallback if the view doesn’t exist
    return res.status(status).type("text/plain").send("404 Not Found");
  }
};
