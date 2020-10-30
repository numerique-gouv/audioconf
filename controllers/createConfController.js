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

  let confData = {}
  try {
    confData = await conferences.createConf(email)
  } catch (error) {
    req.flash('error', 'La conférence n\'a pas pu être créée. Vous pouvez réessayer.')
    console.error('Error when creating conference', error)
    return res.redirect('/')
  }

  const formattedPhoneNumber = format.formatFrenchPhoneNumber(confData.phoneNumber)
  const formattedFreeAt = format.formatFrenchDate(confData.freeAt)
  try {
    await emailer.sendConfCreatedEmail(email, formattedPhoneNumber, confData.pin, formattedFreeAt)

    res.render('confCreated', {
      pageTitle: 'La conférence est créée',
      NUM_PIN_DIGITS: config.NUM_PIN_DIGITS,
      formattedPhoneNumber: formattedPhoneNumber,
      pin: confData.pin,
      formattedFreeAt: formattedFreeAt,
      confDurationVerbose: config.CONFERENCE_DURATION_IN_MINUTES/60 + ' heure' + (config.CONFERENCE_DURATION_IN_MINUTES >= 120 ? 's' : '')
    })

  } catch (error) {
    req.flash('error', 'L\'email contenant les identifiants n\'a pas pu être envoyé. Vous pouvez réessayer.')
    console.error('Error when emailing', error)
    return res.redirect('/')
  }
}