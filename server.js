// server.js — Render-friendly baseline with DB seed endpoint
"use strict";

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const flash = require("connect-flash");
const messages = require("express-messages");

const pool = require("./database"); // pg.Pool from database/index.js
const jwtAuth = require("./middleware/jwtAuth");
const navMiddleware = require("./middleware/nav");

const utilities = require("./utilities");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

/* --- Views --- */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.locals.basedir = path.join(__dirname, "views");

/* --- Static & parsers --- */
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

/* --- Session (Postgres-backed) --- */
app.use(session({
  store: new pgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "devsecret",
  resave: true,            // required for connect-flash
  saveUninitialized: true, // required for connect-flash
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60, // 1 hour
  },
}));

/* --- Flash -> messages() helper --- */
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = messages(req, res);
  next();
});

/* --- Auth + Nav (order matters) --- */
app.use(jwtAuth);
app.use(navMiddleware);

/* --- Health & debug helpers (remove after seeding) --- */
app.get("/healthz", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.code || e.message });
  }
});

// Inspect the nav HTML the middleware built (confirms DB rows are visible)
app.get("/__navcheck", (req, res) => {
  res.type("html").send(res.locals.nav || "(no nav)");
});

// One-time rebuild/seed — reads database/rebuild.sql and executes it on Render
// ⚠️ Remove or protect this after running once.
app.post("/__rebuild", async (req, res) => {
  try {
    const sqlPath = path.join(__dirname, "database", "rebuild.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await pool.query(sql);
    res.json({ ok: true, message: "Rebuild complete." });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* --- Routes --- */
app.get("/", baseController.buildHome);
app.use("/inv", inventoryRoute);
app.use("/account", accountRoute);

/* --- 404 --- */
app.use((req, _res, next) => {
  const err = new Error("File Not Found");
  err.status = 404;
  next(err);
});

/* --- Central error handler --- */
app.use(async (err, req, res, next) => {
  const status = err.status || 500;
  console.error(`=== Error at "${req.originalUrl}" ===\n`, err.stack || err);

  // Keep nav if possible
  let nav = res.locals.nav;
  if (!nav) {
    try { nav = await utilities.getNav(req, res, next); } catch (_) {}
  }

  res.status(status).render("errors/error", {
    title: status,
    message: status === 404 ? (err.message || "File Not Found") : "Internal Server Error",
    nav,
    err: process.env.NODE_ENV === "production" ? undefined : err,
  });
});

/* --- Start --- */
app.listen(PORT, () => {
  console.log(`CSE Motors running: http://localhost:${PORT}`);
});
