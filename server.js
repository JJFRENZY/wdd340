// server.js (CommonJS)
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// View engine: EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Allow absolute include paths like include('/partials/_head.ejs')
app.locals.basedir = path.join(__dirname, 'views');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'CSE Motors' });
});

// 404 fallback (optional)
app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`CSE Motors running: http://localhost:${PORT}`);
});
