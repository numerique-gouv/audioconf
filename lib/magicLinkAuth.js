/**
 * Usage :
 * const authRequest = authStart(email)
 *
 * If fail
 * authRequest == { error: "error message"}
 *
 * If success
 * authRequest == { token : "<token>", tokenExpirationDate: "<tokenExpirationDate>" }
 */

const config = require("../config")
const crypto = require("crypto")
const emailer = require("./emailer")
const { isAcceptedEmail, isValidEmail } = require("./emailChecker")
const urls = require("../urls")

const generateToken = () => {
  return crypto.randomBytes(256).toString("base64")
}


module.exports.authStart = async (email) => {
  if (!isValidEmail(email)) {
    return { error: "Email invalide. Avez vous bien tapé votre email ? Vous pouvez réessayer." }
  }

  if (!isAcceptedEmail(email, config.EMAIL_WHITELIST)) {
    return { error: "Cet email ne correspond pas à une agence de l'État. Si vous appartenez à un service de l'État mais votre email n'est pas reconnu par AudioConf, contactez-nous pour que nous le rajoutions!" }
  }

  const token = generateToken()
  const tokenExpirationDate = new Date()
  tokenExpirationDate.setMinutes(tokenExpirationDate.getMinutes() + config.TOKEN_DURATION_IN_MINUTES)

  const validationUrl = `${config.HOSTNAME_WITH_PROTOCOL}${urls.createConf}?token=${encodeURIComponent(token)}`

  try {
    await emailer.sendEmailValidationEmail(email, tokenExpirationDate, validationUrl)
  } catch(err) {
    console.log("Erreur sur la création de token", err)
    return { error : "Une erreur interne s'est produite, nous n'avons pas pu créer votre conférence." }
  }

  return {
    token,
    tokenExpirationDate,
  }
}
