// scripts/db-rebuild.js
// Runs database/rebuild.sql against the DATABASE_URL connection string.
// Safe to run multiple times (your SQL is idempotent).

const { readFileSync } = require("fs");
const { resolve } = require("path");
const { Client } = require("pg");

(async () => {
  try {
    const sqlPath = resolve(__dirname, "..", "database", "rebuild.sql");
    const sql = readFileSync(sqlPath, "utf8");

    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Missing DATABASE_URL environment variable");

    const needSsl =
      /^(require|true)$/i.test(process.env.PGSSLMODE || "") ||
      process.env.NODE_ENV === "production";

    const client = new Client({
      connectionString: url,
      ssl: needSsl ? { rejectUnauthorized: false } : undefined
    });

    await client.connect();
    console.log("[db:rebuild] Connected. Executing rebuild.sql …");
    await client.query(sql);
    console.log("[db:rebuild] Done. Database rebuilt and seeded.");
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("[db:rebuild] Failed:", err && (err.message || err));
    process.exit(1);
  }
})();
