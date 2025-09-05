/* ******************************************
 * This is the application server
 * ******************************************/
const path = require("path")
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const staticRoutes = require("./routes/static") // <-- import the static router

const app = express()

/* ******************************************
 * View Engine and Templates
 * ***************************************** */
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(expressLayouts)
app.set("layout", "layouts/layout")

/* ******************************************
 * Static Routes
 * ***************************************** */
app.use(staticRoutes)

/* ******************************************
 * Index route
 * ***************************************** */
app.get("/", (req, res) => {
  res.render("index", { title: "Home" })
})

/* ******************************************
 * Server host name and port
 * ***************************************** */
const HOST = "localhost"
const PORT = 5500 // per assignment instructions

/* ***********************
 * Log statement to confirm server operation
 * *********************** */
app.listen(PORT, () => {
  console.log(`trial app listening on ${HOST}:${PORT}`)
})
