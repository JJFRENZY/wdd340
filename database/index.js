// database/index.js
"use strict";

const { Pool } = require("pg");
try { require("dotenv").config({ override: true }); } catch (_) {}

const isProd = String(process.env.NODE_ENV).toLowerCase() === "production";

/**
 * Build a pg Pool config.
 * Prefers DATABASE_URL for hosted envs (Render/Heroku/etc).
 * Falls back to discrete PG* vars for local dev.
 */
function buildPoolConfig() {
  const rawUrl = process.env.DATABASE_URL;
  const url = rawUrl && rawUrl.trim(); // treat empty as unset

  // Determine SSL need:
  // - Force SSL in production (Render typically requires it)
  // - Or when PGSSLMODE=require|true
  const wantSsl =
    isProd || /^(require|true)$/i.test(process.env.PGSSLMODE || "");

  // Common pool options
  const common = {
    // Tune these if your class rubric suggests different values
    max: Number(process.env.PGPOOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT || 10_000),
    keepAlive: true,
    allowExitOnIdle: false,
    ssl: wantSsl ? { rejectUnauthorized: false } : false,
  };

  // Prefer a single hosted URL (Render/Heroku/etc.)
  if (url) {
    return {
      connectionString: url,
      ...common,
    };
  }

  // Otherwise require discrete PG* vars (local)
  const host = (process.env.PGHOST || "").trim();
  const user = (process.env.PGUSER || "").trim();
  const database = (process.env.PGDATABASE || "").trim();

  if (!host || !user || !database) {
    throw new Error(
      "No database configuration found. Either set DATABASE_URL (hosted) " +
      "or PGHOST/PGUSER/PGDATABASE (local).\n" +
      "Example hosted:\n" +
      "  DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB\n" +
      "Example local:\n" +
      "  PGHOST=localhost PGUSER=postgres PGDATABASE=cse_motors"
    );
  }

  return {
    host,
    port: Number(process.env.PGPORT || 5432),
    user,
    password: process.env.PGPASSWORD || "",
    database,
    ...common,
  };
}

const config = buildPoolConfig();
const pool = new Pool(config);

/* ---------------------------
 * Dev-only visibility (no secrets)
 * --------------------------- */
if (!isProd) {
  const viaUrl = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
  // DO NOT log full URLs or passwords
  console.log("[db] Config:", {
    viaUrl,
    host: viaUrl ? "(via URL)" : config.host,
    database: viaUrl ? "(via URL)" : config.database,
    ssl: !!config.ssl,
    max: config.max,
    idleTimeoutMillis: config.idleTimeoutMillis,
    connectionTimeoutMillis: config.connectionTimeoutMillis,
  });

  // Wrap query for lightweight error visibility in dev
  const _query = pool.query.bind(pool);
  pool.query = async (text, params) => {
    try {
      return await _query(text, params);
    } catch (err) {
      const firstLine = (text || "").split("\n")[0];
      console.error("[db] query error on:", firstLine);
      throw err;
    }
  };
}

/* ---------------------------
 * Global pool error handler
 * --------------------------- */
pool.on("error", (err) => {
  console.error("Postgres Pool error:", err);
});

/* ---------------------------
 * Optional health check helper
 * --------------------------- */
async function healthCheck() {
  // Lightweight connectivity probe
  const { rows } = await pool.query("SELECT 1 as ok");
  return rows && rows[0] && rows[0].ok === 1;
}

module.exports = Object.assign(pool, { healthCheck });
