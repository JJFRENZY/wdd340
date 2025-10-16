// controllers/favoritesController.js
const utilities = require("../utilities");
const favModel = require("../models/favorites-model");

exports.listMine = async (req, res, next) => {
  try {
    const nav = await utilities.getNav(req, res, next);
    const acct = res.locals.accountData;
    const items = await favModel.listByAccount(acct.account_id);
    return res.render("account/favorites", {
      title: "Saved Vehicles",
      nav,
      errors: null,
      items,
    });
  } catch (e) { return next(e); }
};

exports.add = async (req, res, next) => {
  try {
    const acct = res.locals.accountData;
    const inv_id = parseInt(req.body.inv_id, 10);
    if (!Number.isInteger(inv_id) || inv_id < 1) {
      req.flash("notice", "Invalid vehicle.");
      return res.redirect("back");
    }
    await favModel.addFavorite(acct.account_id, inv_id);
    req.flash("notice", "Saved to your vehicles.");
    return res.redirect("back");
  } catch (e) { return next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const acct = res.locals.accountData;
    const inv_id = parseInt(req.body.inv_id, 10);
    if (!Number.isInteger(inv_id) || inv_id < 1) {
      req.flash("notice", "Invalid vehicle.");
      return res.redirect("back");
    }
    await favModel.removeFavorite(acct.account_id, inv_id);
    req.flash("notice", "Removed from your saved vehicles.");
    return res.redirect("back");
  } catch (e) { return next(e); }
};
