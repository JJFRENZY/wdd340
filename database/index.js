// database/index.js
const { Pool } = require("pg");
try { require("dotenv").config({ override: true }); } catch (_) {}

const isProd = process.env.NODE_ENV === "production";

function buildPoolConfig() {
  const rawUrl = process.env.DATABASE_URL;
  const url = rawUrl && rawUrl.trim(); // treat empty string as "not set"

  // Prefer a single hosted URL (Render/Heroku/etc.)
  if (url) {
    return {
      connectionString: url,
      ssl:
        /^(require|true)$/i.test(process.env.PGSSLMODE || "") || isProd
          ? { rejectUnauthorized: false }
          : false,
    };
  }

  // Otherwise require discrete PG* vars
  const host = (process.env.PGHOST || "").trim();
  const user = (process.env.PGUSER || "").trim();
  const database = (process.env.PGDATABASE || "").trim();

  if (!host || !user || !database) {
    throw new Error(
      "No database configuration found. Either set DATABASE_URL (hosted) or PGHOST/PGUSER/PGDATABASE (local). " +
      "Example hosted: DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB?sslmode=require " +
      "Example local: PGHOST=localhost PGUSER=postgres PGDATABASE=cse_motors"
    );
  }

  return {
    host,
    port: Number(process.env.PGPORT || 5432),
    user,
    password: process.env.PGPASSWORD || "",
    database,
    ssl: /^(require|true)$/i.test(process.env.PGSSLMODE || "")
      ? { rejectUnauthorized: false }
      : false,
  };
}

const config = buildPoolConfig();
const pool = new Pool(config);

// Dev visibility so you can see what it chose
if (!isProd) {
  console.log("[db] Using config:", {
    viaUrl: !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim()),
    host: config.host || "(via URL)",
    database: config.database || "(via URL)",
    ssl: !!config.ssl,
  });

  // Optional: minimal error logging for queries in dev
  const _query = pool.query.bind(pool);
  pool.query = async (text, params) => {
    try {
      return await _query(text, params);
    } catch (err) {
      console.error("[db] query error:", (text || "").split("\n")[0]);
      throw err;
    }
  };
}

pool.on("error", (err) => console.error("Postgres Pool error:", err));

module.exports = pool;
