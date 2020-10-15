const express = require('express')
const path = require('path')

const app = express()
const port = process.env.PORT || 8080

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/static', express.static('static'))
// Hack for importing css from npm package
app.use('/~', express.static(path.join(__dirname, 'node_modules')))


const appName = 'CoucouCollègues'

app.get('/', (req, res) => {
  res.render('landing', {
    appName: appName,
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
