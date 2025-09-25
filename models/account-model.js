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
  try {
    const sql = `
      INSERT INTO account
        (account_firstname, account_lastname, account_email, account_password, account_type)
      VALUES ($1, $2, $3, $4, 'Client')
      RETURNING *;
    `;
    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    ]);
    return result; // controller checks truthiness/rowCount
  } catch (error) {
    console.error("registerAccount error:", error);
    return null;
  }
}

/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email) {
  try {
    const sql = "SELECT 1 FROM account WHERE account_email = $1 LIMIT 1";
    const email = await pool.query(sql, [account_email]);
    return email.rowCount; // 0 = available, >0 = exists
  } catch (error) {
    console.error("checkExistingEmail error:", error);
    return null;
  }
}

module.exports = {
  registerAccount,
  checkExistingEmail,
};
