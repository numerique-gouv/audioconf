const url = require('url')

const config = require("../config.js")
const db = require('../lib/db')
const format = require('../lib/format')
const urls = require('../urls')
const magicLinkAuth = require("../lib/magicLinkAuth")
const oidcAuth = require("../lib/oidcAuth")


module.exports.sendValidationEmail = async (req, res) => {
  const userTimezoneOffset = req.body.userTimezoneOffset
  const email = req.body.email
  const conferenceDurationInMinutes = req.body.durationInMinutes
  const conferenceDayString = req.body.day
  if (typeof conferenceDayString === 'undefined' && typeof conferenceDurationInMinutes === 'undefined') {
    throw new Error('Both conferenceDayString and conferenceDurationInMinutes are undefined. This should not happen.')
  }

  console.log("FEATURE_OIDC", config.FEATURE_OIDC)
  const authRequest = await (
    config.FEATURE_OIDC ? 
    oidcAuth.authStart(email) :
    magicLinkAuth.authStart(email)
  )

  if (authRequest.error) {
    console.log("Error in magicLinkAuth", authRequest.error)
    req.flash("error", authRequest.error)
    return res.redirect("/")
  }

  try {
    await db.insertToken(email, authRequest.token, authRequest.tokenExpirationDate, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
    console.log(`Login token créé pour ${format.hashForLogs(email)}, il expire à ${authRequest.tokenExpirationDate}`)
  } catch(err) {
    console.log("Error when inserting authrequest token in DB", err)
    req.flash("error", "Une erreur interne s'est produite, nous n'avons pas pu créer votre conférence.")
    return res.redirect("/")
  }

  res.redirect(authRequest.redirectUrl)
}
