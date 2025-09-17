// server.js (CommonJS)
const path = require('path');
const express = require('express');
const asyncHandler = require('./utilities/asyncHandler'); // higher-order error wrapper
const baseController = require('./controllers/baseController'); // your home controller
const inventoryRoute = require('./routes/inventoryRoute'); // <-- NEW

const app = express();
const PORT = process.env.PORT || 8080;

// View engine: EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Allow absolute include paths like include('/partials/_head.ejs')
app.locals.basedir = path.join(__dirname, 'views');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- Routes --------------------

// Index route — MVC controller method
app.get('/', asyncHandler(baseController.buildHome));

// Inventory routes
app.use('/inv', inventoryRoute);

// Optional: a test route that throws
app.get(
  '/kaboom',
  asyncHandler(async (req, res) => {
    const err = new Error('Test explosion 💥');
    err.status = 418;
    throw err;
  })
);

// -------------------- 404 + Error handlers --------------------

// 404: create an Error and pass to the centralized error handler
app.use((req, res, next) => {
  const err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use((err, req, res, next) => {
  const status = err.status || 500;

  // Log full details on the server (safe to keep detailed here)
  console.error(`Error at "${req.originalUrl}":\n`, err.stack || err.message);

  // Generic message for non-404s (don't leak internals to the browser)
  let message;
  if (status === 404) {
    message = err.message || 'File Not Found';
  } else {
    message = 'Oh no! There was a crash. Maybe try a different route?';
  }

  res.status(status).render('errors/error', {
    title: status,
    message
  });
});

// -------------------- Start server --------------------
app.listen(PORT, () => {
  console.log(`CSE Motors running: http://localhost:${PORT}`);
});
