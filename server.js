/* ******************************************
 * This is the application server
 * ******************************************/
const path = require("path")
const express = require("express")
const expressLayouts = require("express-ejs-layouts")

const app = express()

/* ******************************************
 * View Engine and Templates
 * ***************************************** */
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views")) // explicit, safe
app.use(expressLayouts)
app.set("layout", "layouts/layout") // not at views root

// Serve static files from /public (CSS, images, JS)
app.use(express.static(path.join(__dirname, "public")))

/* ******************************************
 * Default GET route
 * ***************************************** */
app.get("/", (req, res) => {
  res.render("index", { title: "Home" })
})

/* ******************************************
 * Server host name and port
 * ***************************************** */
const HOST = "localhost"
const PORT = 3000

/* ***********************
 * Log statement to confirm server operation
 * *********************** */
app.listen(PORT, () => {
  console.log(`trial app listening on ${HOST}:${PORT}`)
})
