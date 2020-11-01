const bodyParser = require('body-parser')
const express = require('express')
const flash = require('connect-flash')
const path = require('path')
const session = require('express-session')

const config = require('./config')
const conferences = require('./lib/conferences')
const db = require('./lib/db')
const format = require('./lib/format')
const createConfController = require('./controllers/createConfController')
const sendValidationEmailController = require('./controllers/sendValidationEmailController')
const urls = require('./urls')

const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.locals.format = format;

app.use('/static', express.static('static'))
// Hack for importing css from npm package
app.use('/~', express.static(path.join(__dirname, 'node_modules')))
app.use(bodyParser.urlencoded({ extended: false }));
// Session is necessary for flash.
app.use(session({
  // todo : chose a prod-appropriate store, the default MemoryStore has memoryleaks and other problems.
  secret: 'aaaa',
  resave: false,
  saveUninitialized: false, // "complying with laws that require permission before setting a cookie"
  cookie: {
    maxAge: 300000,
    sameSite: 'lax' // todo strict would be better for prod
  } }));
app.use(flash())
// Populate some variables for all views
app.use(function(req, res, next){
  res.locals.appName = config.APP_NAME
  res.locals.errors = req.flash('error')
  res.locals.message = req.flash('message')
  res.locals.urls = urls
  next()
})

app.get(urls.landing, async (req, res) => {
  const freePhoneNumbers = await db.getFreePhoneNumberList()
  const hasFreePhoneNumbers = (freePhoneNumbers.length > 0)
  res.render('landing', {
    NUM_PIN_DIGITS: config.NUM_PIN_DIGITS,
    pageTitle: 'Accueil',
    hasFreePhoneNumbers: hasFreePhoneNumbers,
    CONFERENCE_MAX_DURATION_IN_MINUTES: config.CONFERENCE_MAX_DURATION_IN_MINUTES
  })
})

app.post(urls.sendValidationEmail, sendValidationEmailController.sendValidationEmail)

app.get(urls.validationEmailSent, (req, res) => {
  res.render('validationEmailSent', {
    pageTitle: 'Un email de validation a été envoyé',
    email: req.query.email
  })
})

app.get(urls.createConf, createConfController.createConf)

app.get(urls.showConf, createConfController.showConf)

app.get(urls.legalNotice, (req, res) => {
  res.render('legalNotice', {
    pageTitle: 'Mentions Légales',
  })
})

const init = async () => {
  try {
     const phoneNumbers = await conferences.getAllPhoneNumbers()
     await Promise.all(phoneNumbers.map(phoneNumber => db.insertPhoneNumber(phoneNumber)))
  } catch(err) {
    console.log("Erreur dans la récupération des numéros de conférence sur l'API OVH", err)
  }
}

module.exports = app.listen(config.PORT, () => {
  init();
  console.log(`${config.APP_NAME} listening at http://localhost:${config.PORT}`)
})
