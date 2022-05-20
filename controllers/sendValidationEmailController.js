const config = require("../config.js")
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
    oidcAuth.authStart(email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset) :
    magicLinkAuth.authStart(email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
  )

  if (authRequest.error) {
    console.log("Error in magicLinkAuth", authRequest.error)
    req.flash("error", authRequest.error)
    return res.redirect("/")
  }

  res.redirect(authRequest.redirectUrl)
}
