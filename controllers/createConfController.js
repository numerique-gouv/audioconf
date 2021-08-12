const url = require("url")
const jwt = require("jsonwebtoken")

const conferences = require("../lib/conferences")
const config = require("../config")
const db = require("../lib/db")
const emailer = require("../lib/emailer")
const format = require("../lib/format")
const urls = require("../urls")
const { isAcceptedEmail } = require("./utils")
const { encrypt } = require("../lib/crypto")

const createConfWithDuration = async (email, durationInMinutes) => {
  try {
    console.log(`Création d'un numéro de conférence pour ${format.hashForLogs(email)} pour ${durationInMinutes} minutes`)
    const now = new Date()
    const freeAt = new Date(now.getTime() + durationInMinutes * 60 * 1000)
    const OVHconfData = await conferences.createConf(freeAt)

    const conference = await db.insertConference(email, OVHconfData.phoneNumber, durationInMinutes, OVHconfData.freeAt)
    conference.pin = OVHconfData.pin
    return conference
  } catch (err) {
    console.error(`Error when creating conference with duration ${durationInMinutes}`, err)
    throw new Error(`Error when creating conference with duration ${durationInMinutes}`)
  }
}

const createConfWithDay = async (email, conferenceDay, userTimezoneOffset) => {
  try {
    console.log(`Création d'un numéro de conférence pour ${format.hashForLogs(email)} pour le ${conferenceDay}`)

    const freeAt = conferences.computeConfExpirationDate(conferenceDay, userTimezoneOffset)

    const OVHconfData = await conferences.createConf(freeAt)

    const conference = await db.insertConferenceWithDay(email, OVHconfData.phoneNumber, conferenceDay, OVHconfData.freeAt)
    conference.pin = OVHconfData.pin
    return conference
  } catch (err) {
    console.error(`Error when creating conference for day ${conferenceDay}`, err)
    throw new Error(`Error when creating conference for day ${conferenceDay}`)
  }
}

module.exports.createConf = async (req, res) => {
  const token = req.query.token

  const tokensData = await db.getToken(token)
  const isTokenValid = tokensData.length === 1

  if (!isTokenValid) {
    req.flash("error", "Ce lien de confirmation ne marche plus, il a expiré. Entrez votre email ci-dessous pour recommencer.")
    return res.redirect("/")
  }

  const tokenData = tokensData[0]
  const { email, durationInMinutes, conferenceDay, userTimezoneOffset } = tokenData

  if (!conferenceDay && !durationInMinutes) {
    console.error("Login token contained no conferenceDay and no durationInMinutes. Cannot create conference.")
    req.flash("error", "La conférence n'a pas pu être créée. Vous pouvez réessayer.")
    return res.redirect("/")
  }

  let conference = {}
  try {
    if (durationInMinutes) {
      conference = await createConfWithDuration(email, durationInMinutes)
    } else {
      conference = await createConfWithDay(email, conferenceDay, userTimezoneOffset)
    }
  } catch (err) {
    req.flash("error", "La conférence n'a pas pu être créée. Vous pouvez réessayer.")
    console.error("Error when creating conference", err)
    return res.redirect("/")
  }

  try {
    await emailer.sendConfCreatedEmail(email, conference.phoneNumber, conference.pin, durationInMinutes, conferenceDay, conference.expiresAt, config.POLL_URL, userTimezoneOffset)
  } catch (err) {
    req.flash("error", "L'email contenant les identifiants n'a pas pu être envoyé. Vous pouvez réessayer.")
    console.error("Error when emailing", err)
    return res.redirect("/")
  }

  console.log(isAcceptedEmail(email, config.EMAIL_WEB_ACCESS_WHITELIST), config.FEATURE_WEB_ACCESS)
  if (isAcceptedEmail(email, config.EMAIL_WEB_ACCESS_WHITELIST) && config.FEATURE_WEB_ACCESS) { // check if email is in whitelist
    try {
      const token = encrypt(jwt.sign({ roomNumber: conference.pin} , config.SECRET, { expiresIn: durationInMinutes * 60 }))
      await emailer.sendConfWebAccessEmail({
        email,
        phoneNumber: conference.phoneNumber,
        conferenceDay: conferenceDay,
        url: `${config.HOSTNAME_WITH_PROTOCOL}/dashboard/${token}`,
        pin: conference.pin
      })
    } catch (err) {
      console.error("Error when emailing", err)
      req.flash("error", "L'email contenant le lien de modération n'a pas pu être envoyé. Vous pouvez réessayer.")
      return res.redirect("/")
    }
  }
  return res.redirect(urls.showConf.replace(":id", conference.id) + "#" + conference.pin)

}


module.exports.showConf = async (req, res) => {
  const confId = req.params.id

  try {
    const conference = await db.getUnexpiredConference(confId)

    if (!conference) {
      req.flash("error", "La conférence a expiré. Vous pouvez recréer une conférence.")
      return res.redirect("/")
    }

    if (conference.canceledAt) {
      req.flash("error", `La conférence a été annulée le ${format.formatFrenchDateTime(conference.canceledAt)}. Si vous avez encore besoin d\'une conférence, vous pouvez en créer une nouvelle.`)
      return res.redirect("/")
    }

    res.render("confCreated", {
      pageTitle: "Votre conférence",
      conference
    })
  } catch (error) {
    req.flash("error", "La conférence a expiré. Vous pouvez recréer une conférence.")
    console.error("showConf error", error)
    return res.redirect("/")
  }
}

// Note : if called for a conf created with Rooms API, this will do nothing.
module.exports.cancelConf = async (req, res) => {
  const confId = req.params.id
  try {
    const conference = await db.cancelConference(confId)
    req.flash("info", "La conférence a bien été annulée. Si vous avez encore besoin d'une conférence, vous pouvez en créer une nouvelle.")
    console.log(`La conférence ${confId} a été annulée`)
    return res.redirect("/")
  } catch (err) {
    req.flash("error", "Une erreur s'est produite pendant l'annulation de la conférence.")
    console.error("Erreur pour annuler la conférence", err)
    return res.redirect("/")
  }
}
