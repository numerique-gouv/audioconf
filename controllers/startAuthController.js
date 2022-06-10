const config = require("../config.js")
const magicLinkAuth = require("../lib/magicLinkAuth")
const oidcAuth = require("../lib/oidcAuth")


module.exports.startAuth = async (req, res) => {
  const userTimezoneOffset = req.body.userTimezoneOffset
  const email = req.body.email
  const conferenceDurationInMinutes = req.body.durationInMinutes
  const conferenceDayString = req.body.day
  if (typeof conferenceDayString === 'undefined' && typeof conferenceDurationInMinutes === 'undefined') {
    throw new Error('Both conferenceDayString and conferenceDurationInMinutes are undefined. This should not happen.')
  }

  const authRequest = await (
    config.FEATURE_OIDC ?
    oidcAuth.startAuth(email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset) :
    magicLinkAuth.startAuth(email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
  )

  if (authRequest.error) {
    console.log("Error in authentication", authRequest.error)
    req.flash("error", authRequest.error)
    return res.redirect("/")
  }

  res.redirect(authRequest.redirectUrl)
}
