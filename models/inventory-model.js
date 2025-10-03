// models/inventory-model.js
const pool = require("../database"); // pg Pool instance

/* ================================
 * Classifications
 * ================================ */

/** Get all classification rows (ordered) */
async function getClassifications() {
  try {
    const data = await pool.query(
      "SELECT * FROM public.classification ORDER BY classification_name"
    );
    return data; // callers use data.rows
  } catch (error) {
    console.error("getClassifications error:", error);
    throw error;
  }
}

/** Insert a new classification and return the inserted row */
async function addClassification(classification_name) {
  try {
    const sql = `
      INSERT INTO public.classification (classification_name)
      VALUES ($1)
      RETURNING classification_id, classification_name
    `;
    const { rows } = await pool.query(sql, [classification_name]);
    return rows[0]; // { classification_id, classification_name }
  } catch (error) {
    console.error("addClassification error:", error);
    // Let controller render the add view with a flash instead of 500 page
    return null;
  }
}

/* ================================
 * Inventory
 * ================================ */

/** Get all inventory items (with classification_name) by classification_id */
async function getInventoryByClassificationId(classification_id) {
  try {
    const sql = `
      SELECT i.*, c.classification_name
        FROM public.inventory AS i
        JOIN public.classification AS c
          ON i.classification_id = c.classification_id
       WHERE i.classification_id = $1
       ORDER BY i.inv_make, i.inv_model
    `;
    const { rows } = await pool.query(sql, [classification_id]);
    return rows;
  } catch (error) {
    console.error("getInventoryByClassificationId error:", error);
    throw error;
  }
}

/** Get a single vehicle by inv_id */
async function getInventoryById(invId) {
  try {
    const sql = `
      SELECT i.*, c.classification_name
        FROM public.inventory i
        JOIN public.classification c
          ON i.classification_id = c.classification_id
       WHERE i.inv_id = $1
       LIMIT 1
    `;
    const { rows } = await pool.query(sql, [invId]);
    return rows[0]; // undefined if not found
  } catch (error) {
    console.error("getInventoryById error:", error);
    throw error;
  }
}

/** Alias so controllers can call getVehicleById() */
async function getVehicleById(invId) {
  return getInventoryById(invId);
}

/** Insert a new vehicle and return the inserted row */
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
        (inv_make, inv_model, inv_year, inv_description,
         inv_image, inv_thumbnail, inv_price, inv_miles,
         inv_color, classification_id)
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
    // Let controller re-render add-inventory with sticky values + flash
    return null;
  }
}

/* ***************************
 *  Update Inventory Data
 *  (expects an object payload)
 * ************************** */
async function updateInventory({
  inv_id,
  inv_make,
  inv_model,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_year,
  inv_miles,
  inv_color,
  classification_id,
}) {
  try {
    const sql = `
      UPDATE public.inventory
         SET inv_make = $1,
             inv_model = $2,
             inv_year = $3,
             inv_description = $4,
             inv_image = $5,
             inv_thumbnail = $6,
             inv_price = $7,
             inv_miles = $8,
             inv_color = $9,
             classification_id = $10
       WHERE inv_id = $11
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
      inv_id,
    ];
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
  } catch (error) {
    console.error("updateInventory error:", error);
    return null;
  }
}

/* ***************************
 *  Delete Inventory Item
 *  Returns true on success, false on failure
 * ************************** */
async function deleteInventoryItem(inv_id) {
  try {
    const sql = `DELETE FROM public.inventory WHERE inv_id = $1`;
    const result = await pool.query(sql, [inv_id]);
    return result.rowCount === 1;
  } catch (error) {
    console.error("deleteInventoryItem error:", error);
    return false;
  }
}

module.exports = {
  // reads
  getClassifications,
  getInventoryByClassificationId,
  getInventoryById,
  getVehicleById, // alias

  // writes
  addClassification,
  addInventory,
  updateInventory,
  deleteInventoryItem, // ✅ NEW
};
