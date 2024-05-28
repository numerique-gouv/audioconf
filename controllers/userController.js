const oidcAuth = require("../lib/oidcAuth")
const urls = require("../urls")

module.exports.startAuth = async (req, res) => {
  const userTimezoneOffset = req.body.userTimezoneOffset
  const conferenceDurationInMinutes = req.body.durationInMinutes
  const conferenceDayString = req.body.day
  if (typeof conferenceDayString === 'undefined' && typeof conferenceDurationInMinutes === 'undefined') {
    throw new Error('Both conferenceDayString and conferenceDurationInMinutes are undefined. This should not happen.')
  }

  const authRequest = await oidcAuth.startAuth(conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)

  if (authRequest.error) {
    console.log("Error in authentication", authRequest.error)
    req.flash("error", authRequest.error)
    return res.redirect("/")
  }

  res.redirect(authRequest.redirectUrl)
}

module.exports.logout = async (req, res) => {
  const user = req.session.user
  if(!user){
    return res.redirect(urls.landing)
  }
  const {id_token, state} = user
  console.log(`state :  ${state}`)
  console.log(`id_token_hint :  ${id_token}`)
  req.session.destroy()

  const logoutUrl = await oidcAuth.getLogoutUrl({id_token_hint: id_token, state})
  console.log("LOGOUT", logoutUrl)
  return res.redirect(logoutUrl)
}
