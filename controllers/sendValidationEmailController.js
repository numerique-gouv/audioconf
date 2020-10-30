const crypto = require('crypto')
const url = require('url')

const config = require('../config');
const db = require('../lib/db')
const emailer = require('../lib/emailer')
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
    !/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(email)
  ) {
    return false
  }
  return true
}

const generateToken = () => {
  return crypto.randomBytes(256).toString("base64");
}

module.exports.sendValidationEmail = async (req, res) => {
  const email = req.body.email

  if (!isValidEmail(email)) {
    req.flash('error', 'Email invalide. Avez vous bien tapé votre email ? Vous pouvez réessayer.')
    return res.redirect('/')
  }

  if (!isAcceptedEmail(email)) {
    req.flash('error', `Cet email ne correspond pas à une agence de l\'Etat. Vous ne pouvez pas utiliser ${config.APP_NAME} avec cet email.`)
    return res.redirect('/')
  }

  const token = generateToken()
  const tokenExpirationDate = new Date()
  tokenExpirationDate.setMinutes(tokenExpirationDate.getMinutes() + config.TOKEN_DURATION_IN_MINUTES)
  try {
    await db.insertToken(email, token, tokenExpirationDate)
    console.log(`Login token créé pour ${email}, il expire à ${tokenExpirationDate}`)

    const validationUrl = `${config.PROTOCOL}://${req.get('host')}${urls.createConf}?token=${encodeURIComponent(token)}`
    await emailer.sendEmailValidationEmail(email, token, tokenExpirationDate, validationUrl)

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
