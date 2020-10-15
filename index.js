const express = require('express')
const path = require('path')

const app = express()
const port = process.env.PORT || 8080

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Hack for importing css from npm package
app.use('/~', express.static(path.join(__dirname, 'node_modules')))


// Dummy users
var users = [
  { name: 'tobi', email: 'tobi@learnboost.com' },
  { name: 'loki', email: 'loki@learnboost.com' },
  { name: 'jane', email: 'jane@learnboost.com' }
]

app.get('/', (req, res) => {
  res.render('hello', {
    users: users,
    title: "Hello hello hello",
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
