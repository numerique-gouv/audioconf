const url = require('url')

const conferences = require('../lib/conferences')
const config = require('../config')
const db = require('../lib/db')
const emailer = require('../lib/emailer')
const format = require('../lib/format')
const urls = require('../urls')


module.exports.createConf = async (req, res) => {
  const token = req.query.token

  const tokensData = await db.getToken(token)
  const isTokenValid = tokensData.length === 1

  if (!isTokenValid) {
    req.flash('error', 'Ce lien de confirmation ne marche plus, il a expiré. Entrez votre email ci-dessous pour recommencer.')
    return res.redirect('/')
  }

  const tokenData = tokensData[0]
  const email = tokenData.email
  const durationInMinutes = tokenData.durationInMinutes

  console.log(`Création d'un numéro de conférence pour ${email} pour ${durationInMinutes} minutes`)

  let confData = {} // todo internal to the try catch ?
  let conference = {}
  try {
    confData = await conferences.createConf(email, durationInMinutes)

    conference = await db.insertConference(email, phoneNumber, durationInMinutes, confData.freeAt)
    console.log('conference returned from db', conference) // todo remove this log
    conference.pin = confData.pin
  } catch (err) {
    req.flash('error', 'La conférence n\'a pas pu être créée. Vous pouvez réessayer.')
    console.error('Error when creating conference', err)
    return res.redirect('/')
  }

  let phoneNumber = confData.phoneNumber
  const confUrl = `${config.PROTOCOL}://${req.get('host')}${urls.showConf.replace(":id", conference.id)}#annuler`
  try {
    await emailer.sendConfCreatedEmail(email, phoneNumber, confData.pin, durationInMinutes, confData.freeAt, confUrl)

    req.flash('pin', conference.pin)
    return res.redirect(urls.showConf.replace(":id", conference.id))
  } catch (err) {
    req.flash('error', 'L\'email contenant les identifiants n\'a pas pu être envoyé. Vous pouvez réessayer.')
    console.error('Error when emailing', err)
    return res.redirect('/')
  }
}


module.exports.showConf = async (req, res) => {
  const confId = req.params.id

  try {
    const conference = await db.getConference(confId)

    if (conference.canceledAt) {
      req.flash('error', `La conférence a été annulée le ${format.formatFrenchDate(conference.canceledAt)}. Si vous avez encore besoin d\'une conférence, vous pouvez en créer une nouvelle.`)
      return res.redirect('/')
    }

    const pin = req.flash('pin')
    if(pin.length) {
      conference.pin = pin
    }
    res.render('confCreated', {
      pageTitle: 'Votre conférence',
      conference
    })
  } catch (error) {
    req.flash('error', 'La conférence a expiré. Vous pouvez recréer une conférence.')
    console.error('showConf error', error)
    return res.redirect('/')
  }
}


module.exports.cancelConf = async (req, res) => {
  const confId = req.params.id
  try {
    const conference = await db.cancelConference(confId)

    req.flash('success', 'La conférence a bien été annulée. Si vous avez encore besoin d\'une conférence, vous pouvez en créer une nouvelle.')
    console.log(`La conférence ${confId} a été annulée`)
    return res.redirect('/')
  } catch (err) {
    req.flash('error', 'Une erreur s\'est produite pendant l\'annulation de la conférence.')
    console.error('Erreur pour annuler la conférence', err)
    return res.redirect('/')
  }
}