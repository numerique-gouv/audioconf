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