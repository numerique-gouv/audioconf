const express = require('express')
const path = require('path')
const bodyParser = require('body-parser');
const emailer = require('./emailer')
const conferences = require('./conferences')

const port = process.env.PORT || 8080
const appName = 'CoucouCollègues' // todo config


const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/static', express.static('static'))
// Hack for importing css from npm package
app.use('/~', express.static(path.join(__dirname, 'node_modules')))
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  res.render('landing', {
    appName: appName,
  })
})

app.post('/create-conf', async (req, res) => {
  const email = req.body.email

  // todo Errors : surround with try/catch and do something
  const confData = await conferences.createConf(email)
  await emailer.sendConfCreatedEmail(email, confData.phoneNumber, confData.id)

  res.redirect('/conf-created')
})

// Todo gather all the url strings somewhere, for easy changing later
app.get('/conf-created', (req, res) => {
  res.render('confCreated', {
    appName: appName,
  })
})


module.exports = app.listen(port, () => {
  console.log(`${appName} listening at http://localhost:${port}`)
})
