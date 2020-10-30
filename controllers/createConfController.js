const url = require('url')

const conferences = require('../lib/conferences')
const config = require('../config')
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

module.exports.createConf = async (req, res) => {
  const email = req.body.email

  if (!isValidEmail(email)) {
    req.flash('error', 'Email invalide. Avez vous bien tapé votre email ? Vous pouvez réessayer.')
    return res.redirect('/')
  }

  if (!isAcceptedEmail(email)) {
    req.flash('error', `Cet email ne correspond pas à une agence de l\'Etat. Vous ne pouvez pas utiliser ${config.APP_NAME} avec cet email.`)
    return res.redirect('/')
  }

  let confData = {}
  try {
    confData = await conferences.createConf(email)
  } catch (error) {
    req.flash('error', 'La conférence n\'a pas pu être créée. Vous pouvez réessayer.')
    console.error('Error when creating conference', error)
    return res.redirect('/')
  }

  try {
    await emailer.sendConfCreatedEmail(email, confData.phoneNumber, confData.pin, confData.freeAt)
    res.redirect(url.format({
      pathname: urls.confCreated,
      query: { email: email },
    }))
  } catch (error) {
    req.flash('error', 'L\'email contenant les identifiants n\'a pas pu être envoyé. Vous pouvez réessayer.')
    console.error('Error when emailing', error)
    return res.redirect('/')
  }
}