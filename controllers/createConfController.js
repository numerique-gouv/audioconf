const emailer = require('../lib/emailer')
const conferences = require('../lib/conferences')

module.exports.createConf = async (req, res) => {
  const email = req.body.email

  if (
    email === undefined ||
    !/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(email)
  ) {
    req.flash('error', 'Email invalide. Avez vous bien tapé votre email ? Vous pouvez réessayer.')
    return res.redirect('/')
  }

  // todo Errors : surround with try/catch and do something
  const confData = await conferences.createConf(email)

  // todo Errors : surround with try/catch and do something
  await emailer.sendConfCreatedEmail(email, confData.phoneNumber, confData.id)

  res.redirect('/conf-created')
}