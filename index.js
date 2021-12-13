const bodyParser = require("body-parser")
const express = require("express")
const Sentry = require("@sentry/node")
const flash = require("connect-flash")
const path = require("path")
const querystring = require("querystring")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const MemoryStore = require("memorystore")(session)

const config = require("./config")
const db = require("./lib/db")
const format = require("./lib/format")
const createConfController = require("./controllers/createConfController")
const landingController = require("./controllers/landingController")
const sendValidationEmailController = require("./controllers/sendValidationEmailController")
const statusController = require("./controllers/statusController")
const stats = require("./lib/stats")
const urls = require("./urls")

if (config.NODE_ENV === "development") {
  console.dir({ config })
}

const version = require("./package.json").version

const app = express()

Sentry.init({
  dsn: process.env.SENTRY_DSN
})

app.use(Sentry.Handlers.requestHandler())

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.locals.format = format

app.use("/static", express.static("static"))
app.use("/static/gouvfr", express.static(path.join(__dirname, "node_modules/@gouvfr/dsfr/dist")))
app.use("/chart.js", express.static(path.join(__dirname, "node_modules/chart.js/dist")))
app.use("/static/remixicon", express.static(path.join(__dirname, "node_modules/remixicon/fonts")))
app.use(bodyParser.urlencoded({ extended: false }))

app.use(cookieParser(config.secret))
// Only used for Flash not safe for others purposes
app.use(session({
  secret: config.SECRET,
  resave: false,
  saveUninitialized: false, // "complying with laws that require permission before setting a cookie"
  cookie: {
    maxAge: 300000,
    sameSite: "lax" // todo strict would be better for prod
  },
  store: new MemoryStore({
    checkPeriod: 300000
  })
}))

app.use(flash())
// Populate some variables for all views
app.use(function(req, res, next){
  res.locals.appName = config.APP_NAME
  res.locals.supportEmail = config.SUPPORT_EMAIL
  res.locals.pollUrl = config.POLL_URL
  res.locals.numPinDigits = config.NUM_PIN_DIGITS
  res.locals.errors = req.flash("error")
  res.locals.infos = req.flash("info")
  res.locals.successes = req.flash("success")
  res.locals.urls = urls
  res.locals.version = version
  res.locals.siteUrl = config.HOSTNAME_WITH_PROTOCOL
  next()
})

app.get(urls.landing, landingController.getLanding)

app.post(urls.sendValidationEmail, sendValidationEmailController.sendValidationEmail)

app.get(urls.validationEmailSent, (req, res) => {
  res.render("validationEmailSent", {
    pageTitle: "Un email de validation a été envoyé",
    email: req.query.email
  })
})

app.get(urls.createConf, createConfController.createConf)

app.get(urls.showConf, createConfController.showConf)

app.post(urls.cancelConf, createConfController.cancelConf)

app.get(urls.legalNotice, (req, res) => {
  res.render("legalNotice", {
    pageTitle: "Mentions Légales",
  })
})

if (config.FEATURE_STATS_PAGE) {
  app.get(urls.stats, async (req, res) => {
    if (config.STATS_EXTERNAL_DASHBOARD_URL) {
      res.render("stats", {
        pageTitle: "Statistiques",
        dashboardUrl: config.STATS_EXTERNAL_DASHBOARD_URL,
      })
      return
    }
    const NUM_STATS_POINTS = 1440 // 24h if 1 point per hour
    let latestStats = []
    try {
      latestStats = await db.getLatestStatsPoints(NUM_STATS_POINTS)
    } catch (err) {
      console.error("Impossible de récupérer les statsPoints", err)
    }

    const formattedStats = stats.formatDataForDisplay(latestStats)

    res.render("stats", {
      pageTitle: "Statistiques",
      stats: formattedStats
    })
  })
}

app.get(urls.contact, (req, res) => {
  res.render("contact", {
    pageTitle: "Contact",
  })
})

app.get(urls.faq, (req, res) => {
  res.render("faq", {
    pageTitle: "Questions fréquentes",
  })
})

app.get(urls.startFranceConnect, (req, res) => {
  console.log("Auth start !")
  const authUrl = "https://fcp.integ01.dev-franceconnect.fr/api/v1/authorize"
  const params = {
    response_type: "code",
    // test value for france connect staging
    client_id: "211286433e39cce01db448d80181bdfd005554b19cd51b3fe7943f6b3b86ab6e",
    redirect_uri: "http://localhost:8080/callback",
    scope: "openid",
    // Champ obligatoire, généré aléatoirement par le FS, que FC renvoie tel quel dans la
    // redirection qui suit l'authentification, pour être ensuite vérifié par le FS.
    // Il est utilisé afin d’empêcher l’exploitation de failles CSRF
    state: Math.floor(Math.random() * 1000),
    // Champ obligatoire, généré aléatoirement par le FS que FC renvoie tel quel dans la
    // réponse à l'appel à /token, pour être ensuite vérifié par le FS.
    // Il est utilisé pour empêcher les attaques par rejeu
    nonce: Math.floor(Math.random() * 1000),
    // European thing. 1 = standard.
    acr_values: "eidas1",
  }
  const fullUrl = `${authUrl}?${querystring.stringify(params)}`
  console.log("fullUrl", fullUrl)
  return res.redirect(fullUrl)
})

app.get(urls.franceConnectCallback, (req, res) => {
  console.log("Auth callback !")
  console.log("code", req.query.code)
  console.log("state", req.query.state)
  res.json({ code: req.query.code, state: req.query.state })
})

app.get(urls.status, statusController.getStatus)

app.use(Sentry.Handlers.errorHandler())

module.exports = app.listen(config.PORT, () => {
  console.log(`It is ${format.formatFrenchDateTime(new Date())}, ${config.APP_NAME} listening at http://localhost:${config.PORT}`)
})

process.on("unhandledRejection", error => {
  // Will print "unhandledRejection err is not defined"
  console.log("unhandledRejection erreur : ", error.message)
})
