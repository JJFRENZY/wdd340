// controllers/favoritesController.js
const utilities = require("../utilities");
const favModel = require("../models/favorites-model");

/**
 * GET /account/favorites
 * Render the current user's saved vehicles.
 */
exports.buildList = async (req, res, next) => {
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
  } catch (e) {
    return next(e);
  }
};

/**
 * POST /account/favorites/add
 * Save a vehicle for the current user (no-op if already saved).
 */
exports.add = async (req, res, next) => {
  try {
    const acct = res.locals.accountData;
    const inv_id = parseInt(req.body.inv_id, 10);

    if (!Number.isInteger(inv_id) || inv_id < 1) {
      req.flash("notice", "Invalid vehicle.");
      return res.redirect(req.get("referer") || "/");
    }

    await favModel.addFavorite(acct.account_id, inv_id);
    req.flash("notice", "Saved to your vehicles.");
    return res.redirect(req.get("referer") || "/account/favorites");
  } catch (e) {
    return next(e);
  }
};

/**
 * POST /account/favorites/remove
 * Remove a saved vehicle.
 */
exports.remove = async (req, res, next) => {
  try {
    const acct = res.locals.accountData;
    const inv_id = parseInt(req.body.inv_id, 10);

    if (!Number.isInteger(inv_id) || inv_id < 1) {
      req.flash("notice", "Invalid vehicle.");
      return res.redirect(req.get("referer") || "/");
    }

    await favModel.removeFavorite(acct.account_id, inv_id);
    req.flash("notice", "Removed from your saved vehicles.");
    return res.redirect(req.get("referer") || "/account/favorites");
  } catch (e) {
    return next(e);
  }
};

/**
 * POST /account/favorites/toggle
 * Optional helper: toggle a favorite on/off.
 * If body.action === "add" or "remove", force that behavior.
 */
exports.toggle = async (req, res, next) => {
  try {
    const acct = res.locals.accountData;
    const inv_id = parseInt(req.body.inv_id, 10);
    const action = (req.body.action || "").toLowerCase();

    if (!Number.isInteger(inv_id) || inv_id < 1) {
      req.flash("notice", "Invalid vehicle.");
      return res.redirect(req.get("referer") || "/");
    }

    if (action === "add") {
      await favModel.addFavorite(acct.account_id, inv_id);
      req.flash("notice", "Saved to your vehicles.");
    } else if (action === "remove") {
      await favModel.removeFavorite(acct.account_id, inv_id);
      req.flash("notice", "Removed from your saved vehicles.");
    } else {
      const exists = await favModel.isFavorite(acct.account_id, inv_id);
      if (exists) {
        await favModel.removeFavorite(acct.account_id, inv_id);
        req.flash("notice", "Removed from your saved vehicles.");
      } else {
        await favModel.addFavorite(acct.account_id, inv_id);
        req.flash("notice", "Saved to your vehicles.");
      }
    }

    return res.redirect(req.get("referer") || "/account/favorites");
  } catch (e) {
    return next(e);
  }
};
