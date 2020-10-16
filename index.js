const express = require('express')
const path = require('path')
const bodyParser = require('body-parser');
const emailer = require('./emailer')

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

  // Todo query OVH for conf number and id
  const generateInteger = numDigits => {
    return Math.floor(Math.random() * Math.pow(10, numDigits))
  }
  const confPhoneNumber = '0' + generateInteger(9)
  const confId = generateInteger(6)

  await emailer.sendConfCreatedEmail(email, confPhoneNumber, confId)
  // todo Errors : surround with try/catch and do something

  res.render('confCreated', {
    appName: appName,
    email: email,
    confPhoneNumber: confPhoneNumber,
    confId: confId
  })
})


module.exports = app.listen(port, () => {
  console.log(`${appName} listening at http://localhost:${port}`)
})
