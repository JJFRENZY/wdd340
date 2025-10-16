// middleware/flashToLocals.js
"use strict";
const expressMessages = require("express-messages");

module.exports = function flashToLocals(req, res, next) {
  // Makes <%- messages() %> available in views
  res.locals.messages = expressMessages(req, res);
  next();
};
