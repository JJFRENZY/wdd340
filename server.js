// server.js (CommonJS) — UPDATED
const path = require("path");
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("./database"); // pg.Pool from database/index.js
const flash = require("connect-flash");
const messages = require("express-messages");
const cookieParser = require("cookie-parser");
const jwtAuth = require("./middleware/jwtAuth"); // <-- use our JWT sanity middleware

const asyncHandler = require("./utilities/asyncHandler");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");
const favoritesRoute = require("./routes/favoritesRoute"); // ✅ NEW
const utilities = require("./utilities"); // for getNav() in error handler

// Load env locally (no-op in prod)
try { require("dotenv").config({ override: true }); } catch (_) {}

// ===== Startup sanity checks for env secrets =====
if (!process.env.ACCESS_TOKEN_SECRET) {
  throw new Error("Missing ACCESS_TOKEN_SECRET env var");
}
if (!process.env.SESSION_SECRET) {
  throw new Error("Missing SESSION_SECRET env var");
}

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
 * Basic security / headers
 * ====================== */
app.disable("x-powered-by");

/* ======================
 * View engine: EJS
 * ====================== */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Allow absolute EJS includes like include('/partials/foo.ejs')
app.locals.basedir = path.join(__dirname, "views");

/* ======================
 * Static + parsers
 * ====================== */
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser()); // <- must be before jwtAuth

/* ======================
 * Sessions (stored in Postgres)
 * ====================== */
app.use(session({
  store: new pgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,                // required for connect-flash
  saveUninitialized: true,
  name: "sessionId",
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
  },
}));

/* ======================
 * Flash messages
 * ====================== */
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = messages(req, res); // exposes messages() to views
  next();
});

/* ======================
 * Request-level auth sanity check
 *  - Always sets res.locals.loggedin (boolean) and res.locals.accountData (object|null)
 * ====================== */
app.use(jwtAuth);

/* ======================
 * Health check (optional)
 * ====================== */
app.get("/healthz", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.code || e.message });
  }
});

/* ======================
 * Routes
 * ====================== */

// Home
app.get("/", asyncHandler(baseController.buildHome));

// Accounts (login, register, etc.)
app.use("/account", accountRoute);

// Favorites (Saved Vehicles) — ✅ NEW
app.use("/account/favorites", favoritesRoute);

// Inventory (classification, detail, intentional 500)
app.use("/inv", inventoryRoute);

// Optional: quick test route that throws a custom error
app.get(
  "/kaboom",
  asyncHandler(async () => {
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
 * ====================== */
app.use(async (err, req, res, next) => {
  const status = err.status || 500;

  // Log details on server
  console.error(`Error at "${req.originalUrl}":\n`, err.stack || err.message);

  // Avoid re-querying DB for nav if the error is clearly DB/DNS
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

  // Only show stack in non-production
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
