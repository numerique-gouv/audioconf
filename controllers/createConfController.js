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
  console.log(`Création d'un numéro de conférence pour ${format.hashForLogs(email)} pour ${durationInMinutes} minutes`)

  let conference = {}
  try {
    const OVHconfData = await conferences.createConf(email, durationInMinutes)

    conference = await db.insertConference(email, OVHconfData.phoneNumber, durationInMinutes, OVHconfData.freeAt)
    conference.pin = OVHconfData.pin
  } catch (err) {
    req.flash('error', 'La conférence n\'a pas pu être créée. Vous pouvez réessayer.')
    console.error('Error when creating conference', err)
    return res.redirect('/')
  }

  const confUrl = `${config.PROTOCOL}://${req.get('host')}${urls.showConf.replace(":id", conference.id)}#${conference.pin}`
  try {
    await emailer.sendConfCreatedEmail(email, conference.phoneNumber, conference.pin, durationInMinutes, conference.expiresAt, confUrl)

    return res.redirect(urls.showConf.replace(":id", conference.id) + '#' + conference.pin)
  } catch (err) {
    req.flash('error', 'L\'email contenant les identifiants n\'a pas pu être envoyé. Vous pouvez réessayer.')
    console.error('Error when emailing', err)
    return res.redirect('/')
  }
}


module.exports.showConf = async (req, res) => {
  const confId = req.params.id

  try {
    const conference = await db.getUnexpiredConference(confId)

    if (!conference) {
      req.flash('error', 'La conférence a expiré. Vous pouvez recréer une conférence.')
      return res.redirect('/')
    }

    if (conference.canceledAt) {
      req.flash('error', `La conférence a été annulée le ${format.formatFrenchDate(conference.canceledAt)}. Si vous avez encore besoin d\'une conférence, vous pouvez en créer une nouvelle.`)
      return res.redirect('/')
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

    req.flash('info', 'La conférence a bien été annulée. Si vous avez encore besoin d\'une conférence, vous pouvez en créer une nouvelle.')
    console.log(`La conférence ${confId} a été annulée`)
    return res.redirect('/')
  } catch (err) {
    req.flash('error', 'Une erreur s\'est produite pendant l\'annulation de la conférence.')
    console.error('Erreur pour annuler la conférence', err)
    return res.redirect('/')
  }
}