// models/favorites-model.js
const pool = require("../database");

/** List all favorites for an account, joined with inventory info */
async function listByAccount(account_id) {
  const sql = `
    SELECT f.favorite_id, f.inv_id, f.created_at,
           i.inv_make, i.inv_model, i.inv_year, i.inv_price, i.inv_thumbnail
      FROM public.favorite f
      JOIN public.inventory i ON i.inv_id = f.inv_id
     WHERE f.account_id = $1
     ORDER BY f.created_at DESC`;
  const { rows } = await pool.query(sql, [account_id]);
  return rows;
}

/** Add a favorite (no-op if it already exists) */
async function addFavorite(account_id, inv_id) {
  const sql = `
    INSERT INTO public.favorite (account_id, inv_id)
    VALUES ($1, $2)
    ON CONFLICT (account_id, inv_id) DO NOTHING
    RETURNING *`;
  const { rows } = await pool.query(sql, [account_id, inv_id]);
  return rows[0] || null;
}

/** Remove a favorite */
async function removeFavorite(account_id, inv_id) {
  const sql = `DELETE FROM public.favorite WHERE account_id = $1 AND inv_id = $2`;
  const result = await pool.query(sql, [account_id, inv_id]);
  return result.rowCount === 1;
}

/** Check if a vehicle is already favorited by this account */
async function isFavorite(account_id, inv_id) {
  const sql = `SELECT 1 FROM public.favorite WHERE account_id = $1 AND inv_id = $2`;
  const { rowCount } = await pool.query(sql, [account_id, inv_id]);
  return rowCount === 1;
}

module.exports = { listByAccount, addFavorite, removeFavorite, isFavorite };
