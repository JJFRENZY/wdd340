// utilities/index.js
"use strict";

const invModel = require("../models/inventory-model");
const Util = {};

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for General Error Handling
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* =========================
 * Formatting helpers
 * ========================= */
Util.formatUSD = function (amount) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
};

Util.formatNumber = function (n) {
  try {
    return new Intl.NumberFormat("en-US").format(n);
  } catch {
    return String(n);
  }
};

/* =========================
 * Small escaping helpers
 * ========================= */
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function currentPath(req) {
  const raw = (req && (req.originalUrl || req.url)) || "/";
  try {
    const u = new URL(raw, "http://local");
    return (u.pathname || "/").replace(/\/+$/, "") || "/";
  } catch {
    return (String(raw).split("?")[0].split("#")[0] || "/").replace(/\/+$/, "") || "/";
  }
}

/* ************************
 * Constructs the nav HTML unordered list from DB
 *  - Works with either shape: { rows:[...] } or [...]
 *  - Fail-soft: minimal nav if empty/errored
 ************************** */
Util.getNav = async function (req, _res, _next) {
  try {
    const data = await invModel.getClassifications();

    // Normalize to an array: allow [..] or {rows:[..]}
    const rows = Array.isArray(data) ? data
               : Array.isArray(data?.rows) ? data.rows
               : [];

    console.log(`[getNav] classifications count: ${rows.length}`);

    const cur = currentPath(req);
    let list = "<ul>";

    // Home first
    list += `<li><a href="/" title="Home page"${cur === "/" ? ' aria-current="page"' : ""}>Home</a></li>`;

    // Then each classification
    rows.forEach((row) => {
      const id = row.classification_id;
      const name = escapeHtml(row.classification_name);
      const href = `/inv/type/${encodeURIComponent(id)}`;
      const active = cur === href ? ' aria-current="page"' : "";
      list += `<li><a href="${href}" title="See our inventory of ${name} vehicles"${active}>${name}</a></li>`;
    });

    list += "</ul>";
    return list;
  } catch (e) {
    console.error("getNav(): falling back due to error:", e?.message || e);
    // Minimal nav fallback (prevents homepage 500 when DB is empty/missing)
    return '<ul><li><a href="/" title="Home page">Home</a></li></ul>';
  }
};

/* **************************************
 * Build the classification view HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
  const rows = Array.isArray(data) ? data
             : Array.isArray(data?.rows) ? data.rows
             : [];

  if (!rows.length) {
    return '<p class="notice">Sorry, no matching vehicles could be found.</p>';
  }

  let grid = '<ul id="inv-display">';
  rows.forEach((vehicle) => {
    const title = `${escapeHtml(vehicle.inv_make)} ${escapeHtml(vehicle.inv_model)}`;
    const detailHref = "/inv/detail/" + encodeURIComponent(vehicle.inv_id); // ✅ absolute path

    grid += "<li>";
    grid +=
      '<a href="' +
      detailHref +
      '" title="View ' +
      title +
      ' details"><img src="' +
      escapeHtml(vehicle.inv_thumbnail) +
      '" alt="Image of ' +
      title +
      ' on CSE Motors" /></a>';
    grid += '<div class="namePrice">';
    grid += "<hr />";
    grid += "<h2>";
    grid +=
      '<a href="' +
      detailHref +
      '" title="View ' +
      title +
      ' details">' +
      title +
      "</a>";
    grid += "</h2>";
    grid += "<span>" + Util.formatUSD(vehicle.inv_price) + "</span>";
    grid += "</div>";
    grid += "</li>";
  });
  grid += "</ul>";
  return grid;
};

/* **************************************
 * Build the single-vehicle DETAIL HTML
 * (Used by controllers/invController.js -> buildDetail)
 * ************************************ */
Util.buildVehicleDetailHtml = function (v) {
  if (!v) return "<p class='notice'>Vehicle not found.</p>";

  const title = `${escapeHtml(v.inv_year)} ${escapeHtml(v.inv_make)} ${escapeHtml(v.inv_model)}`;

  return `
  <article class="vehicle-detail">
    <figure class="vehicle-media">
      <img src="${escapeHtml(v.inv_image)}"
           alt="Image of ${title}"
           loading="eager" />
      <figcaption>${title}</figcaption>
    </figure>

    <section class="vehicle-info" aria-labelledby="veh-h1">
      <dl class="vehicle-specs">
        <div><dt>Make</dt><dd>${escapeHtml(v.inv_make)}</dd></div>
        <div><dt>Model</dt><dd>${escapeHtml(v.inv_model)}</dd></div>
        <div><dt>Year</dt><dd>${escapeHtml(v.inv_year)}</dd></div>
        <div><dt>Price</dt><dd>${Util.formatUSD(v.inv_price)}</dd></div>
        <div><dt>Mileage</dt><dd>${Util.formatNumber(v.inv_miles)} miles</dd></div>
        <div><dt>Color</dt><dd>${escapeHtml(v.inv_color)}</dd></div>
        <div><dt>Class</dt><dd>${escapeHtml(v.classification_name)}</dd></div>
      </dl>

      <p class="vehicle-desc">${escapeHtml(v.inv_description)}</p>
    </section>
  </article>
  `;
};

/* **************************************
 * Build classification <select> element for forms
 *  - Makes previously chosen item sticky when classification_id is provided
 * ************************************ */
Util.buildClassificationList = async function (classification_id = null) {
  try {
    const data = await invModel.getClassifications();
    const rows = Array.isArray(data) ? data
               : Array.isArray(data?.rows) ? data.rows
               : [];

    let classificationList =
      '<select name="classification_id" id="classificationList" required>';
    classificationList += "<option value=''>Choose a Classification</option>";

    rows.forEach((row) => {
      classificationList += '<option value="' + row.classification_id + '"';
      if (
        classification_id != null &&
        Number(row.classification_id) === Number(classification_id)
      ) {
        classificationList += " selected";
      }
      classificationList += ">" + escapeHtml(row.classification_name) + "</option>";
    });

    classificationList += "</select>";
    return classificationList;
  } catch (e) {
    console.error("buildClassificationList error:", e?.message || e);
    // Safe fallback so the view still renders
    return `
      <select name="classification_id" id="classificationList" required>
        <option value=''>Choose a Classification</option>
      </select>
    `;
  }
};

/* ****************************************
 *  Check Login (general authorization gate)
 *  - Expects a prior JWT middleware to set res.locals.loggedin
 * ************************************ */
Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    return next();
  } else {
    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }
};

module.exports = Util;
