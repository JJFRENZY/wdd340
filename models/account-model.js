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
      INSERT INTO public.account
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
    return result; // controller checks result.rowCount
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
    const sql = "SELECT 1 FROM public.account WHERE account_email = $1 LIMIT 1";
    const email = await pool.query(sql, [account_email]);
    return email.rowCount; // 0 = available, >0 = exists
  } catch (error) {
    console.error("checkExistingEmail error:", error);
    return null;
  }
}

/* *****************************
 * Return account data using email address
 * (includes hashed password for login compare)
 * ***************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = `
      SELECT account_id,
             account_firstname,
             account_lastname,
             account_email,
             account_type,
             account_password
        FROM public.account
       WHERE account_email = $1
       LIMIT 1;
    `;
    const { rows } = await pool.query(sql, [account_email]);
    return rows[0] || null;
  } catch (error) {
    console.error("getAccountByEmail error:", error);
    return null;
  }
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
};
