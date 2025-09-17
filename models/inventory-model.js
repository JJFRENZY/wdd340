// models/inventory-model.js
const pool = require("../database") // your pg Pool instance export

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  try {
    const data = await pool.query(
      "SELECT * FROM public.classification ORDER BY classification_name"
    )
    return data
  } catch (error) {
    console.error("getClassifications error:", error)
    throw error
  }
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
       JOIN public.classification AS c 
         ON i.classification_id = c.classification_id 
       WHERE i.classification_id = $1
       ORDER BY i.inv_make, i.inv_model`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getclassificationsbyid error " + error)
    throw error
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
}
