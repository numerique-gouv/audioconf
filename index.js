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
const landingController = require('./controllers/landingController')
const sendValidationEmailController = require('./controllers/sendValidationEmailController')
const stats = require('./lib/stats')
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
  res.locals.pollUrl = config.POLL_URL
  res.locals.errors = req.flash('error')
  res.locals.infos = req.flash('info')
  res.locals.successes = req.flash('success')
  res.locals.urls = urls
  next()
})

app.get(urls.landing, landingController.getLanding)

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

if (config.FEATURE_STATS_PAGE) {
  app.get(urls.stats, async (req, res) => {
    const NUM_STATS_POINTS = 1440 // 24h if 1 point per hour
    let latestStats = []
    try {
      latestStats = await db.getLatestStatsPoints(NUM_STATS_POINTS)
    } catch (err) {
      console.error(`Impossible de récupérer les statsPoints`, err)
    }

    const formattedStats = stats.formatDataForDisplay(latestStats)

    res.render('stats', {
      pageTitle: 'Statistiques',
      stats: formattedStats,
    })
  })
}

app.get(urls.contact, (req, res) => {
  res.render('contact', {
    pageTitle: 'Contact',
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

const ovh = require('ovh')({
  appKey: config.OVH_ROOM_APP_KEY,
  appSecret: config.OVH_ROOM_APP_SECRET,
  consumerKey: config.OVH_ROOM_CONSUMER_KEY,
})

const phoneNumber = config.OVH_ROOM_PHONE_NUMBER
const accountNumber = config.OVH_ROOM_ACCOUNT_NUMBER

const roomsUrl = `/telephony/${accountNumber}/conference/${phoneNumber}/rooms`
ovh.requestPromised('GET', roomsUrl, {}).then(result => console.log(result))

Promise.resolve()
  .then(() => {
    console.log('Create room')
    return ovh.requestPromised('POST', roomsUrl, {})
  })
  .then(result => {
    console.log(result)
    const roomNumber = result.roomNumber
    const roomUrl = `/telephony/${accountNumber}/conference/${phoneNumber}/rooms/${roomNumber}`

    Promise.resolve()
      .then(() => {
        console.log('Get room settings for room', roomNumber)
        return ovh.requestPromised('GET', roomUrl, {})
      })
      .then(result => console.log(result))
      .then(() => {
        console.log('Set room settings for room', roomNumber)
        return ovh.requestPromised('PUT', roomUrl, {
          pin: '0',
        })
      })
      .then(result => console.log(result))
      .then(() => {
        console.log('Get room settings for room, again', roomNumber)
        return ovh.requestPromised('GET', roomUrl, {})
      })
      .then(result => console.log(result))
  })

