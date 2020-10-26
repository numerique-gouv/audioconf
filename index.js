const bodyParser = require('body-parser');
const express = require('express')
const path = require('path')

const config = require('./config')
const createConfController = require('./controllers/createConfController')

const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/static', express.static('static'))
// Hack for importing css from npm package
app.use('/~', express.static(path.join(__dirname, 'node_modules')))
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  res.render('landing', {
    appName: config.APP_NAME,
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
