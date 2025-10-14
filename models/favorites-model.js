// models/favorites-model.js
const pool = require("../database");

/**
 * Favorites Model (using table: public.favorite)
 * Expected schema (minimum):
 *   CREATE TABLE public.favorite (
 *     account_id   integer NOT NULL REFERENCES public.account(account_id) ON DELETE CASCADE,
 *     inv_id       integer NOT NULL REFERENCES public.inventory(inv_id)   ON DELETE CASCADE,
 *     created_at   timestamptz NOT NULL DEFAULT now(),
 *     -- Optional surrogate key:
 *     favorite_id  bigserial PRIMARY KEY,
 *     -- Ensure idempotent inserts:
 *     UNIQUE (account_id, inv_id)
 *   );
 */

/** List all favorites for an account, joined with inventory (and classification) info */
async function listByAccount(account_id) {
  try {
    const sql = `
      SELECT
        f.favorite_id,         -- may be null if your table doesn't have it
        f.account_id,
        f.inv_id,
        f.created_at,
        i.inv_make,
        i.inv_model,
        i.inv_year,
        i.inv_price,
        i.inv_thumbnail,
        c.classification_name
      FROM public.favorite f
      JOIN public.inventory i
        ON i.inv_id = f.inv_id
      JOIN public.classification c
        ON c.classification_id = i.classification_id
      WHERE f.account_id = $1
      ORDER BY f.created_at DESC
    `;
    const { rows } = await pool.query(sql, [account_id]);
    return rows || [];
  } catch (err) {
    console.error("favorites.listByAccount error:", err);
    return [];
  }
}

/**
 * Add a favorite (idempotent).
 * Returns: true if the row exists after the call, false on error.
 */
async function addFavorite(account_id, inv_id) {
  try {
    const sql = `
      INSERT INTO public.favorite (account_id, inv_id)
      VALUES ($1, $2)
      ON CONFLICT (account_id, inv_id) DO NOTHING
      RETURNING account_id, inv_id
    `;
    const { rows } = await pool.query(sql, [account_id, inv_id]);
    // If conflict happened, no rows returned; row still "exists"
    if (rows && rows.length) return true;

    // Double-check existence in case of conflict path
    const check = await pool.query(
      `SELECT 1 FROM public.favorite WHERE account_id = $1 AND inv_id = $2`,
      [account_id, inv_id]
    );
    return check.rowCount > 0;
  } catch (err) {
    console.error("favorites.addFavorite error:", err);
    return false;
  }
}

/**
 * Remove a favorite.
 * Returns: true if a row was deleted, false otherwise.
 */
async function removeFavorite(account_id, inv_id) {
  try {
    const sql = `DELETE FROM public.favorite WHERE account_id = $1 AND inv_id = $2`;
    const result = await pool.query(sql, [account_id, inv_id]);
    return result.rowCount === 1;
  } catch (err) {
    console.error("favorites.removeFavorite error:", err);
    return false;
  }
}

/**
 * Check if a vehicle is already favorited by this account.
 * Returns: boolean
 */
async function isFavorite(account_id, inv_id) {
  try {
    const sql = `SELECT 1 FROM public.favorite WHERE account_id = $1 AND inv_id = $2 LIMIT 1`;
    const { rowCount } = await pool.query(sql, [account_id, inv_id]);
    return rowCount > 0;
  } catch (err) {
    console.error("favorites.isFavorite error:", err);
    return false;
  }
}

module.exports = {
  listByAccount,
  addFavorite,
  removeFavorite,
  isFavorite,
};
