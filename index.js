const bodyParser = require('body-parser')
const express = require('express')
const flash = require('connect-flash')
const path = require('path')
const session = require('express-session')
const KnexSessionStore = require('connect-session-knex')(session);

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

const store = new KnexSessionStore({
  knex: db.knex,
  tablename: 'sessions',
});
app.use(session({
  secret: config.SECRET,
  resave: false,
  saveUninitialized: false, // "complying with laws that require permission before setting a cookie"
  cookie: {
    maxAge: 300000,
    sameSite: 'lax' // todo strict would be better for prod
  },
  store,
 }));
app.use(flash())
// Populate some variables for all views
app.use(function(req, res, next){
  res.locals.appName = config.APP_NAME
  res.locals.supportEmail = config.SUPPORT_EMAIL
  res.locals.errors = req.flash('error')
  res.locals.infos = req.flash('info')
  res.locals.successes = req.flash('success')
  res.locals.urls = urls
  next()
})

app.get(urls.landing, async (req, res) => {
  const freeNumbers = await db.getPhoneNumberList()
  const now = new Date()
  const numberOfFreePhoneNumbers = freeNumbers.filter(phoneNumber => phoneNumber.freeAt < now).length
  const nextFreePhoneNumberAt = freeNumbers[0] ? freeNumbers[0].freeAt : new Date()

  res.render('landing', {
    NUM_PIN_DIGITS: config.NUM_PIN_DIGITS,
    numberOfFreePhoneNumbers: numberOfFreePhoneNumbers,
    nextFreePhoneNumberAt: nextFreePhoneNumberAt,
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

app.post(urls.cancelConf, createConfController.cancelConf)

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
    console.error('Erreur dans la récupération des numéros de conférence sur l\'API OVH', err)
  }
}

module.exports = app.listen(config.PORT, () => {
  init();
  console.log(`It is ${format.formatFrenchDate(new Date())}, ${config.APP_NAME} listening at http://localhost:${config.PORT}`)
})
