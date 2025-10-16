// scripts/db-seed-classifications.js
// Inserts default classification rows without touching other tables.

const { Client } = require("pg");

const SEED_SQL = `
INSERT INTO public.classification (classification_name) VALUES
  ('Sedan'), ('SUV'), ('Truck'), ('Sport'), ('Utility')
ON CONFLICT (classification_name) DO NOTHING;
`;

(async () => {
  try {
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
    console.log("[db:seed:classifications] Seeding default classifications …");
    await client.query(SEED_SQL);
    console.log("[db:seed:classifications] Done.");
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("[db:seed:classifications] Failed:", err && (err.message || err));
    process.exit(1);
  }
})();
