// models/account-model.js
const pool = require("../database");

/* *****************************
 *   Register new account
 * *************************** */
async function registerAccount(
  account_firstname,
  account_lastname,
  account_email,
  account_password
) {
  const sql = `
    INSERT INTO account (
      account_firstname,
      account_lastname,
      account_email,
      account_password,
      account_type
    )
    VALUES ($1, $2, $3, $4, 'Client')
    RETURNING account_id, account_firstname, account_lastname, account_email, account_type
  `;
  try {
    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    ]);
    return result.rows[0]; // created account
  } catch (err) {
    // Let controller decide how to respond (e.g., duplicate email 23505)
    throw err;
  }
}

module.exports = { registerAccount };
