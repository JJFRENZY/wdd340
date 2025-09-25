// models/account-model.js
const pool = require("../database");

/* *****************************
 *   Register new account
 * *************************** */
async function registerAccount(
  account_firstname,
  account_lastname,
  account_email,
  account_password // <- already hashed by controller
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
  const result = await pool.query(sql, [
    account_firstname,
    account_lastname,
    account_email,
    account_password,
  ]);
  return result.rows[0];
}

module.exports = { registerAccount };
