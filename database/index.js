// database/index.js
// Unified pg Pool export with consistent .query API

const { Pool } = require("pg");
try { require("dotenv").config(); } catch (_) {}

const isProd = process.env.NODE_ENV === "production";
const connectionString =
  process.env.DATABASE_URL ||
  undefined; // if undefined, pg will also read discrete PG* env vars

// Use SSL when a DATABASE_URL is present in prod (e.g., Render)
const ssl =
  connectionString && (isProd || process.env.PGSSLMODE === "require")
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString,
  ssl,
  // If you're using discrete PGHOST/PGUSER/PGPASSWORD/etc locally,
  // pg will pick them up automatically when connectionString is undefined.
});

// Helpful: surface pool-level errors
pool.on("error", (err) => {
  console.error("Postgres Pool error:", err);
});

// Wrap .query for optional logging in non-production
const rawQuery = pool.query.bind(pool);
pool.query = async (text, params) => {
  if (!isProd) console.log("SQL:", text);
  return rawQuery(text, params);
};

module.exports = pool;
