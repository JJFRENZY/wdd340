// server.js (CommonJS)
const path = require("path");
const express = require("express");
const asyncHandler = require("./utilities/asyncHandler");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const utilities = require("./utilities"); // for getNav() in error handler
let db; // lazy-require for /healthz

// Load env in dev
try { require("dotenv").config(); } catch (_) {}

const app = express();
const PORT = process.env.PORT || 8080;

// Basic security / checklist
app.disable("x-powered-by");

// View engine: EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.locals.basedir = path.join(__dirname, "views");

// Static files
app.use(express.static(path.join(__dirname, "public")));

// (Optional) parsers if you add forms later
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// -------------------- Routes --------------------

// Health check (optional but handy)
app.get("/healthz", async (req, res) => {
  try {
    db = db || require("./database");
    await db.query("select 1");
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.code || e.message });
  }
});

// Home
app.get("/", asyncHandler(baseController.buildHome));

// Inventory routes
app.use("/inv", inventoryRoute);

// Optional: a test route that throws
app.get(
  "/kaboom",
  asyncHandler(async () => {
    const err = new Error("Test explosion 💥");
    err.status = 418; // I'm a teapot
    throw err;
  })
);

// -------------------- 404 --------------------
app.use((req, _res, next) => {
  const err = new Error("File Not Found");
  err.status = 404;
  next(err);
});

// -------------------- Central error handler --------------------
app.use(async (err, req, res, next) => {
  const status = err.status || 500;

  // Log on server
  console.error(`Error at "${req.originalUrl}":\n`, err.stack || err.message);

  // If the error is clearly DB/DNS, don't try to build nav (avoids repeated DB calls)
  const msg = (err && (err.message || "")) + "";
  const isDbDown =
    err.code === "ENOTFOUND" ||
    /ENOTFOUND|ECONNREFUSED|ECONNRESET|terminated unexpectedly|no pg_hba/i.test(msg);

  let nav = "";
  if (!isDbDown) {
    try {
      nav = await utilities.getNav(req, res, next);
    } catch (navErr) {
      console.error("Failed to build nav in error handler:", navErr);
    }
  }

  const message =
    status === 404
      ? err.message || "File Not Found"
      : "Oh no! There was a crash. Maybe try a different route?";

  const errForView = process.env.NODE_ENV === "production" ? undefined : err;

  res.status(status).render("errors/error", {
    title: status,
    message,
    nav,
    err: errForView,
  });
});

// -------------------- Start server --------------------
app.listen(PORT, () => {
  console.log(`CSE Motors running: http://localhost:${PORT}`);
});
