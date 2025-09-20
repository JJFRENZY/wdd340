// utilities/index.js
const invModel = require("../models/inventory-model")
const Util = {}

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for General Error Handling
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/* =========================
 * Formatting helpers
 * ========================= */
Util.formatUSD = function (amount) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  } catch {
    return `$${amount}`
  }
}

Util.formatNumber = function (n) {
  try {
    return new Intl.NumberFormat("en-US").format(n)
  } catch {
    return String(n)
  }
}

/* ************************
 * Constructs the nav HTML unordered list from DB
 ************************** */
Util.getNav = async function (_req, _res, _next) {
  const data = await invModel.getClassifications()
  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}

/* **************************************
 * Build the classification view HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
  let grid
  if (data && data.length > 0) {
    grid = '<ul id="inv-display">'
    data.forEach((vehicle) => {
      grid += "<li>"
      grid +=
        '<a href="../../inv/detail/' +
        vehicle.inv_id +
        '" title="View ' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        ' details"><img src="' +
        vehicle.inv_thumbnail +
        '" alt="Image of ' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        ' on CSE Motors" /></a>'
      grid += '<div class="namePrice">'
      grid += "<hr />"
      grid += "<h2>"
      grid +=
        '<a href="../../inv/detail/' +
        vehicle.inv_id +
        '" title="View ' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        ' details">' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        "</a>"
      grid += "</h2>"
      grid +=
        "<span>" +
        Util.formatUSD(vehicle.inv_price) +
        "</span>"
      grid += "</div>"
      grid += "</li>"
    })
    grid += "</ul>"
  } else {
    grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}

/* **************************************
 * Build the single-vehicle DETAIL HTML
 * (Used by controllers/invController.js -> buildDetail)
 * ************************************ */
Util.buildVehicleDetailHtml = function (v) {
  if (!v) return "<p class='notice'>Vehicle not found.</p>"

  const title = `${v.inv_year} ${v.inv_make} ${v.inv_model}`

  return `
  <article class="vehicle-detail">
    <figure class="vehicle-media">
      <img src="${v.inv_image}"
           alt="Image of ${title}"
           loading="eager" />
      <figcaption>${title}</figcaption>
    </figure>

    <section class="vehicle-info" aria-labelledby="veh-h1">
      <dl class="vehicle-specs">
        <div><dt>Make</dt><dd>${v.inv_make}</dd></div>
        <div><dt>Model</dt><dd>${v.inv_model}</dd></div>
        <div><dt>Year</dt><dd>${v.inv_year}</dd></div>
        <div><dt>Price</dt><dd>${Util.formatUSD(v.inv_price)}</dd></div>
        <div><dt>Mileage</dt><dd>${Util.formatNumber(v.inv_miles)} miles</dd></div>
        <div><dt>Color</dt><dd>${v.inv_color}</dd></div>
        <div><dt>Class</dt><dd>${v.classification_name}</dd></div>
      </dl>

      <p class="vehicle-desc">${v.inv_description}</p>
    </section>
  </article>
  `
}

module.exports = Util
