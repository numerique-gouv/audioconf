const emailer = require('../lib/emailer')
const conferences = require('../lib/conferences')

module.exports.createConf = async (req, res) => {
  const email = req.body.email

  // todo validate email

  // todo Errors : surround with try/catch and do something
  const confData = await conferences.createConf(email)

  // todo Errors : surround with try/catch and do something
  await emailer.sendConfCreatedEmail(email, confData.phoneNumber, confData.id)

  res.redirect('/conf-created')
}