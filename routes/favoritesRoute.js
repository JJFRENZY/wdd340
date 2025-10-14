// routes/favoritesRoute.js
const express = require("express");
const router = new express.Router();

const utilities = require("../utilities");
const favoritesController = require("../controllers/favoritesController");
const favValidate = require("../utilities/favorites-validation");

// All favorites routes require login
router.get(
  "/",
  utilities.checkLogin,
  utilities.handleErrors(favoritesController.listMine)
);

router.post(
  "/add",
  utilities.checkLogin,
  favValidate.itemRules(),
  favValidate.checkItem,
  utilities.handleErrors(favoritesController.add)
);

router.post(
  "/remove",
  utilities.checkLogin,
  favValidate.itemRules(),
  favValidate.checkItem,
  utilities.handleErrors(favoritesController.remove)
);

module.exports = router;
