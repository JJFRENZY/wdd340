// server.js (CommonJS)
const path = require("path");
const express = require("express");
const asyncHandler = require("./utilities/asyncHandler");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const utilities = require("./utilities"); // for getNav() in error handler

// Optionally load env vars in dev
try { require("dotenv").config(); } catch (_) {}

const app = express();
const PORT = process.env.PORT || 8080;

/* ======================
 * View engine: EJS
 * ====================== */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Allow absolute EJS includes like include('/partials/...ejs')
app.locals.basedir = path.join(__dirname, "views");

/* ======================
 * Static assets
 * ====================== */
app.use(express.static(path.join(__dirname, "public")));

/* ======================
 * Routes
 * ====================== */

// Home
app.get("/", asyncHandler(baseController.buildHome));

// Inventory routes (classification, detail, 500 trigger)
app.use("/inv", inventoryRoute);

// Optional: quick test route to throw a custom error
app.get(
  "/kaboom",
  asyncHandler(async (_req, _res) => {
    const err = new Error("Test explosion 💥");
    err.status = 418; // I'm a teapot
    throw err;
  })
);

/* ======================
 * 404 handler
 * ====================== */
app.use((req, _res, next) => {
  const err = new Error("File Not Found");
  err.status = 404;
  next(err);
});

/* ======================
 * Central error handler
 * (must have 4 args)
 * ====================== */
app.use(async (err, req, res, next) => {
  const status = err.status || 500;

  // Log server-side details
  console.error(`Error at "${req.originalUrl}":\n`, err.stack || err.message);

  // Build nav so error pages still have site chrome
  let nav = "";
  try {
    nav = await utilities.getNav(req, res, next);
  } catch (navErr) {
    console.error("Failed to build nav in error handler:", navErr);
  }

  // Friendly message (don’t leak internals)
  const message =
    status === 404
      ? err.message || "File Not Found"
      : "Oh no! There was a crash. Maybe try a different route?";

  // In dev, pass error for optional stack trace in the view
  const errForView = process.env.NODE_ENV === "production" ? undefined : err;

  res.status(status).render("errors/error", {
    title: status,
    message,
    nav,
    err: errForView,
  });
});

/* ======================
 * Start server
 * ====================== */
app.listen(PORT, () => {
  console.log(`CSE Motors running: http://localhost:${PORT}`);
});

// update
