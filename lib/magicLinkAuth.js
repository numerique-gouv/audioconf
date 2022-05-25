/**
 * Usage :
 * const authRequest = authStart(email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
 *
 * If fail
 * authRequest == { error: "error message"}
 *
 * If success
 * authRequest == { redirectUrl : "<url>" }
 */
const url = require("url")

const config = require("../config")
const crypto = require("crypto")
const emailer = require("./emailer")
const { isAcceptedEmail, isValidEmail } = require("./emailChecker")
const urls = require("../urls")
const format = require("../lib/format")
const db = require("../lib/db")

const generateToken = () => {
  return crypto.randomBytes(256).toString("base64")
}


module.exports.authStart = async (email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset) => {
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

  const redirectUrl = url.format({
    pathname: urls.validationEmailSent,
    query: {
      email: email
    },
  })

  try {
    await db.insertToken(email, token, tokenExpirationDate, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
    console.log(`Login token créé pour ${format.hashForLogs(email)}, il expire à ${tokenExpirationDate}`)
  } catch(err) {
    console.log("Error when inserting authrequest token in DB", err)
    return { error: "Une erreur interne s'est produite, nous n'avons pas pu créer votre conférence." }
  }

  return { redirectUrl }
}

module.exports.authFinish = async (req) => {
  const token = req.query.token
  console.log("magiclink token", token)

  const confDatas = await db.getToken(token)

  const isTokenValid = confDatas.length === 1
  if (!isTokenValid) {
    // todo use propoer error codes ?
    return { error: "Ce lien de confirmation ne marche plus, il a expiré. Entrez votre email ci-dessous pour recommencer." }
  }

  const confData = confDatas[0]
  console.log("confData", confData)
  return {
    email: confData.email,
    durationInMinutes: confData.durationInMinutes,
    conferenceDay: confData.conferenceDay,
    userTimezoneOffset: confData.userTimezoneOffset,
  }
}
