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

/* Get a single vehicle by inv_id (parameterized) */
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

/* NEW: Insert a classification */
async function addClassification(classification_name) {
  try {
    const sql = `
      INSERT INTO public.classification (classification_name)
      VALUES ($1)
      RETURNING *
    `;
    const { rows } = await pool.query(sql, [classification_name]);
    return rows[0];
  } catch (error) {
    console.error("addClassification error:", error);
    throw error;
  }
}

/* NEW: Insert an inventory item */
async function addInventory({
  inv_make,
  inv_model,
  inv_year,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_miles,
  inv_color,
  classification_id,
}) {
  try {
    const sql = `
      INSERT INTO public.inventory
      (inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail,
       inv_price, inv_miles, inv_color, classification_id)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;
    const params = [
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
    ];
    const { rows } = await pool.query(sql, params);
    return rows[0];
  } catch (error) {
    console.error("addInventory error:", error);
    throw error;
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getInventoryById,
  addClassification,
  addInventory,
};
