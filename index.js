const bodyParser = require('body-parser')
const express = require('express')
const flash = require('connect-flash')
const path = require('path')
const session = require('express-session')

const config = require('./config')
const createConfController = require('./controllers/createConfController')

const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

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

app.get('/', (req, res) => {
  res.render('landing', {
    appName: config.APP_NAME,
    errors: req.flash('error'),
  })
})

app.post('/create-conf', createConfController.createConf)

// Todo gather all the url strings somewhere, for easy changing later
app.get('/conf-created', (req, res) => {
  res.render('confCreated', {
    appName: config.APP_NAME,
    email: req.query.email
  })
})


module.exports = app.listen(config.PORT, () => {
  console.log(`${config.APP_NAME} listening at http://localhost:${config.PORT}`)
})
