const conferences = require('../lib/conferences')
const config = require('../config')
const emailer = require('../lib/emailer')


let isAcceptedEmail = undefined
try {
  const emailRegexes = require('../emailRegexes').regexes
  isAcceptedEmail = (email) => {
    for (const regex of emailRegexes) {
      if (regex.test(email)) {
        return true
      }
    }
    return false
  }
} catch (ex) {
  // No emailRegexes file. No validation to run, everything is accepted.
  isAcceptedEmail = (email) => true
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

  if (isValidEmail(email)) {
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
    await emailer.sendConfCreatedEmail(email, confData.phoneNumber, confData.id)
    res.redirect('/conf-created')
  } catch (error) {
    req.flash('error', 'L\'email contenant les identifiants n\'a pas pu être envoyé. Vous pouvez réessayer.')
    console.error('Error when emailing', error)
    return res.redirect('/')
  }
}