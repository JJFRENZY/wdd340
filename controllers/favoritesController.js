// controllers/favoritesController.js
"use strict";

const favModel = require("../models/favorites-model");

/* Small helpers */
function wantsJson(req) {
  try {
    const preferred = req.accepts(["html", "json"]);
    if (preferred === "json") return true;
  } catch (_) {}
  return Boolean(req.xhr) ||
    /application\/json/i.test(req.get("accept") || "") ||
    /application\/json/i.test(req.get("content-type") || "");
}

function refererOr(req, fallback) {
  return req.get("referer") || req.get("referrer") || fallback;
}

/**
 * GET /account/favorites
 * Render the current user's saved vehicles.
 */
exports.buildList = async (req, res, next) => {
  try {
    const acct = res.locals.accountData;
    if (!acct || !acct.account_id) {
      // Route should be protected, but double-check
      if (wantsJson(req)) {
        return res.status(401).json({ ok: false, message: "Please log in to continue." });
      }
      req.flash("notice", "Please log in to continue.");
      return res.redirect("/account/login");
    }

    const items = await favModel.listByAccount(Number(acct.account_id));

    return res.render("account/favorites", {
      title: "Saved Vehicles",
      nav: res.locals.nav || "",
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
    if (!acct || !acct.account_id) {
      if (wantsJson(req)) {
        return res.status(401).json({ ok: false, message: "Please log in to continue." });
      }
      req.flash("notice", "Please log in to continue.");
      return res.redirect("/account/login");
    }

    const inv_id = Number.parseInt(req.body.inv_id, 10);
    if (!Number.isInteger(inv_id) || inv_id < 1) {
      const msg = "Invalid vehicle.";
      if (wantsJson(req)) return res.status(400).json({ ok: false, message: msg });
      req.flash("notice", msg);
      return res.redirect(refererOr(req, "/"));
    }

    await favModel.addFavorite(Number(acct.account_id), inv_id);

    if (wantsJson(req)) return res.status(200).json({ ok: true, message: "Saved to your vehicles." });

    req.flash("notice", "Saved to your vehicles.");
    return res.redirect(refererOr(req, "/account/favorites"));
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
    if (!acct || !acct.account_id) {
      if (wantsJson(req)) {
        return res.status(401).json({ ok: false, message: "Please log in to continue." });
      }
      req.flash("notice", "Please log in to continue.");
      return res.redirect("/account/login");
    }

    const inv_id = Number.parseInt(req.body.inv_id, 10);
    if (!Number.isInteger(inv_id) || inv_id < 1) {
      const msg = "Invalid vehicle.";
      if (wantsJson(req)) return res.status(400).json({ ok: false, message: msg });
      req.flash("notice", msg);
      return res.redirect(refererOr(req, "/"));
    }

    await favModel.removeFavorite(Number(acct.account_id), inv_id);

    if (wantsJson(req)) return res.status(200).json({ ok: true, message: "Removed from your saved vehicles." });

    req.flash("notice", "Removed from your saved vehicles.");
    return res.redirect(refererOr(req, "/account/favorites"));
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
    if (!acct || !acct.account_id) {
      if (wantsJson(req)) {
        return res.status(401).json({ ok: false, message: "Please log in to continue." });
      }
      req.flash("notice", "Please log in to continue.");
      return res.redirect("/account/login");
    }

    const inv_id = Number.parseInt(req.body.inv_id, 10);
    const action = String(req.body.action || "").toLowerCase();

    if (!Number.isInteger(inv_id) || inv_id < 1) {
      const msg = "Invalid vehicle.";
      if (wantsJson(req)) return res.status(400).json({ ok: false, message: msg });
      req.flash("notice", msg);
      return res.redirect(refererOr(req, "/"));
    }

    if (action === "add") {
      await favModel.addFavorite(Number(acct.account_id), inv_id);
      if (wantsJson(req)) return res.status(200).json({ ok: true, message: "Saved to your vehicles." });
      req.flash("notice", "Saved to your vehicles.");
    } else if (action === "remove") {
      await favModel.removeFavorite(Number(acct.account_id), inv_id);
      if (wantsJson(req)) return res.status(200).json({ ok: true, message: "Removed from your saved vehicles." });
      req.flash("notice", "Removed from your saved vehicles.");
    } else {
      const exists = await favModel.isFavorite(Number(acct.account_id), inv_id);
      if (exists) {
        await favModel.removeFavorite(Number(acct.account_id), inv_id);
        if (wantsJson(req)) return res.status(200).json({ ok: true, message: "Removed from your saved vehicles." });
        req.flash("notice", "Removed from your saved vehicles.");
      } else {
        await favModel.addFavorite(Number(acct.account_id), inv_id);
        if (wantsJson(req)) return res.status(200).json({ ok: true, message: "Saved to your vehicles." });
        req.flash("notice", "Saved to your vehicles.");
      }
    }

    return res.redirect(refererOr(req, "/account/favorites"));
  } catch (e) {
    return next(e);
  }
};
