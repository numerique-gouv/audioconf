const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
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
app.use(cookieParser('dddd')) // todo use secret ?
// todo Fix errors :
/*
express-session deprecated undefined resave option; provide resave option index.js:21:9
express-session deprecated undefined saveUninitialized option; provide saveUninitialized option index.js:21:9
express-session deprecated req.secret; provide secret option index.js:21:9
*/
app.use(session({ cookie: { maxAge: 300000, sameSite: 'lax' } })); // Only used for Flash not safe for others purposes
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
  })
})


module.exports = app.listen(config.PORT, () => {
  console.log(`${config.APP_NAME} listening at http://localhost:${config.PORT}`)
})
