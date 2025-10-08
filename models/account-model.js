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
 *   Returns: number (0 = available, >0 = exists)
 * ********************* */
async function checkExistingEmail(account_email) {
  try {
    const sql = "SELECT 1 FROM public.account WHERE account_email = $1 LIMIT 1";
    const email = await pool.query(sql, [account_email]);
    return email.rowCount;
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

/* *****************************
 * Return account data using account_id
 * (no password returned)
 * ***************************** */
async function getAccountById(account_id) {
  try {
    const sql = `
      SELECT account_id,
             account_firstname,
             account_lastname,
             account_email,
             account_type
        FROM public.account
       WHERE account_id = $1
       LIMIT 1;
    `;
    const { rows } = await pool.query(sql, [account_id]);
    return rows[0] || null;
  } catch (error) {
    console.error("getAccountById error:", error);
    return null;
  }
}

/* *****************************
 * Update account first/last/email by id
 * Returns updated row (no password)
 * ***************************** */
async function updateAccount({ account_id, account_firstname, account_lastname, account_email }) {
  try {
    const sql = `
      UPDATE public.account
         SET account_firstname = $1,
             account_lastname  = $2,
             account_email     = $3
       WHERE account_id = $4
       RETURNING account_id, account_firstname, account_lastname, account_email, account_type;
    `;
    const { rows } = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    ]);
    return rows[0] || null;
  } catch (error) {
    console.error("updateAccount error:", error);
    return null;
  }
}

/* *****************************
 * Update account password hash by id
 * Accepts: { account_id, account_password }
 * Returns: true on success, false otherwise
 * ***************************** */
async function updatePassword({ account_id, account_password }) {
  try {
    const sql = `
      UPDATE public.account
         SET account_password = $1
       WHERE account_id = $2
    `;
    const result = await pool.query(sql, [account_password, account_id]);
    return result.rowCount === 1;
  } catch (error) {
    console.error("updatePassword error:", error);
    return false;
  }
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,     // ✅
  updateAccount,      // ✅
  updatePassword,     // ✅
};
