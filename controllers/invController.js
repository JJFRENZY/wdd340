// controllers/invController.js
const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  try {
    const classification_id = req.params.classificationId
    const data = await invModel.getInventoryByClassificationId(classification_id)
    const grid = await utilities.buildClassificationGrid(data)
    const nav = await utilities.getNav(req, res, next)
    const className = data?.[0]?.classification_name || "Selected"
    res.render("./inventory/classification", {
      title: `${className} vehicles`,
      nav,
      grid,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = invCont
