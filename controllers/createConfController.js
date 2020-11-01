const url = require('url')

const conferences = require('../lib/conferences')
const config = require('../config')
const db = require('../lib/db')
const emailer = require('../lib/emailer')
const format = require('../lib/format')
const urls = require('../urls')


module.exports.createConf = async (req, res) => {
  const token = req.query.token

  const tokensData = await db.getToken(token)
  const isTokenValid = tokensData.length === 1

  if (!isTokenValid) {
    req.flash('error', 'Ce lien de confirmation ne marche plus, il a expiré. Entrez votre email ci dessous pour recommencer.')
    return res.redirect('/')
  }

  const tokenData = tokensData[0]
  const email = tokenData.email
  const durationInMinutes = tokenData.durationInMinutes

  console.log(`Création d'un numéro de conférence pour ${email} pour ${durationInMinutes} minutes`)

  let confData = {}
  try {
    confData = await conferences.createConf(email, durationInMinutes)
  } catch (error) {
    req.flash('error', 'La conférence n\'a pas pu être créée. Vous pouvez réessayer.')
    console.error('Error when creating conference', error)
    return res.redirect('/')
  }
  let phoneNumber = confData.phoneNumber

  try {
    const conference = await db.insertConference(email, phoneNumber, durationInMinutes, confData.freeAt)
    console.log("Création de la conférence", conference)
    conference.pin = confData.pin
    await emailer.sendConfCreatedEmail(email, phoneNumber, confData.pin, durationInMinutes, confData.freeAt)

    res.render('confCreated', {
      pageTitle: 'La conférence est créée',
      conference
    })

  } catch (error) {
    req.flash('error', 'L\'email contenant les identifiants n\'a pas pu être envoyé. Vous pouvez réessayer.')
    console.error('Error when emailing', error)
    return res.redirect('/')
  }
}


module.exports.showConf = async (req, res) => {
  const confId = req.params.id

  try {
    const conference = await db.getConference(confId)

    res.render('confCreated', {
      pageTitle: 'Rappel de votre conférence',
      conference
    })

  } catch (error) {
    req.flash('error', 'La conférence a expiré. Vous pouvez recréer une conférence.')
    console.error('Conference error', error)
    return res.redirect('/')
  }
}