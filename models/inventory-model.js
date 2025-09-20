// models/inventory-model.js
const pool = require("../database"); // your pg Pool instance export

/* Get all classification data */
async function getClassifications() {
  try {
    const data = await pool.query(
      "SELECT * FROM public.classification ORDER BY classification_name"
    );
    return data;
  } catch (error) {
    console.error("getClassifications error:", error);
    throw error;
  }
}

/* Get all inventory items (with classification_name) by classification_id */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT i.*, c.classification_name
         FROM public.inventory AS i
         JOIN public.classification AS c
           ON i.classification_id = c.classification_id
        WHERE i.classification_id = $1
        ORDER BY i.inv_make, i.inv_model`,
      [classification_id]
    );
    return data.rows;
  } catch (error) {
    console.error("getInventoryByClassificationId error:", error);
    throw error;
  }
}

/* NEW: Get a single vehicle by inv_id (parameterized) */
async function getInventoryById(invId) {
  try {
    const sql = `
      SELECT i.*, c.classification_name
        FROM public.inventory i
        JOIN public.classification c
          ON i.classification_id = c.classification_id
       WHERE i.inv_id = $1
    `;
    const { rows } = await pool.query(sql, [invId]);
    return rows[0]; // undefined if not found
  } catch (error) {
    console.error("getInventoryById error:", error);
    throw error;
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getInventoryById, // <- export the new function
};
