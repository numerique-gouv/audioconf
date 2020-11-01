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
    req.flash('error', 'Ce lien de confirmation ne marche plus, il a expiré. Entrez votre email ci dessous pour recommencer.')
    return res.redirect('/')
  }

  const tokenData = tokensData[0]
  const email = tokenData.email
  const durationInMinutes = tokenData.durationInMinutes

  console.log(`Création d'un numéro de conférence pour ${email} pour ${durationInMinutes} minutes`)

  let confData = {}
  try {
    confData = await conferences.createConf(email, durationInMinutes)
  } catch (error) {
    req.flash('error', 'La conférence n\'a pas pu être créée. Vous pouvez réessayer.')
    console.error('Error when creating conference', error)
    return res.redirect('/')
  }
  let phoneNumber = confData.phoneNumber

  try {
    const conference = await db.insertConference(email, phoneNumber, durationInMinutes, confData.freeAt)
    console.log("Création de la conférence", conference)
    conference.pin = confData.pin
    await emailer.sendConfCreatedEmail(email, phoneNumber, confData.pin, durationInMinutes, confData.freeAt)

    req.flash('pin', conference.pin);
    return res.redirect(urls.showConf.replace(":id", conference.id))
  } catch (error) {
    req.flash('error', 'L\'email contenant les identifiants n\'a pas pu être envoyé. Vous pouvez réessayer.')
    console.error('Error when emailing', error)
    return res.redirect('/')
  }
}


module.exports.showConf = async (req, res) => {
  const confId = req.params.id

  try {
    const conference = await db.getConference(confId)
    if(conference.canceledAt) {
      req.flash('error', `La conférence a été annulé le ${format.formatFrenchDate(conference.canceledAt)}. Vous pouvez recréer une conférence.`)
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
    console.error('Conference error', error)
    return res.redirect('/')
  }
}


module.exports.cancelConf = async (req, res) => {
  const confId = req.params.id
  try {
    const conference = await db.cancelConference(confId)

    req.flash('success', 'La conférence a été annulé. Si vous avez besoins, vous pouvez recréer une conférence.')
    console.log(`La conférence ${confId} a été annulé`)
    return res.redirect('/')
  } catch (error) {
    req.flash('error', 'Une erreur c\'est produite pour l\'annulation de la conférence')
    console.error('Erreur pour annuler la conférence', error)
    return res.redirect('/')
  }
}