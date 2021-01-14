const crypto = require('crypto')
const url = require('url')

const config = require('../config');
const db = require('../lib/db')
const emailer = require('../lib/emailer')
const format = require('../lib/format')
const urls = require('../urls')

const isAcceptedEmail = email => {
  for (const regex of config.EMAIL_WHITELIST) {
    if (regex.test(email)) {
      return true
    }
  }
  return false
}

const isValidEmail = (email) => {
  if (
    email === undefined ||
    !/^([a-zA-Z0-9_\-\.']+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(email)
  ) {
    return false
  }
  return true
}

const generateToken = () => {
  return crypto.randomBytes(256).toString("base64");
}

module.exports.sendValidationEmail = async (req, res) => {
  const userTimezoneOffset = req.body.userTimezoneOffset
  const email = req.body.email
  const conferenceDurationInMinutes = req.body.durationInMinutes
  const conferenceDayString = req.body.day
  if (typeof conferenceDayString === 'undefined' && typeof conferenceDurationInMinutes === 'undefined') {
    throw new Error('Both conferenceDayString and conferenceDurationInMinutes are undefined. This should not happen.')
  }

  if (!isValidEmail(email)) {
    req.flash('error', 'Email invalide. Avez vous bien tapé votre email ? Vous pouvez réessayer.')
    return res.redirect('/')
  }

  if (!isAcceptedEmail(email)) {
    req.flash('error', {
      message: `Cet email ne correspond pas à une agence de l\'État. Si vous appartenez à un service de l'État mais votre email n'est pas reconnu par AudioConf, contactez-nous pour que nous le rajoutions!`,
      withContactLink: true,
    })
    return res.redirect('/')
  }

  // TODO : token creation should be done by db.js, and expose db.createAndInsertToken.
  const token = generateToken()
  const tokenExpirationDate = new Date()
  tokenExpirationDate.setMinutes(tokenExpirationDate.getMinutes() + config.TOKEN_DURATION_IN_MINUTES)

  try {
    await db.insertToken(email, token, tokenExpirationDate, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
    console.log(`Login token créé pour ${format.hashForLogs(email)}, il expire à ${tokenExpirationDate}`)

    const validationUrl = `${config.PROTOCOL}://${config.HOSTNAME}${urls.createConf}?token=${encodeURIComponent(token)}`
    await emailer.sendEmailValidationEmail(email, tokenExpirationDate, validationUrl)

    res.redirect(url.format({
      pathname: urls.validationEmailSent,
      query: {
        email: email
      },
    }))
  } catch(err) {
    console.log('Erreur sur la création de token', err)
    req.flash('error', 'Une erreur interne s\'est produite, nous n\'avons pas pu créer votre conférence.')
    return res.redirect('/')
  }
}
