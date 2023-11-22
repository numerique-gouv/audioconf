const nodemailer = require("nodemailer")
const ejs = require("ejs")
const path = require("path")

const config = require("../config")
const format = require("./format")

const mailOptions = {
  debug: true,
  auth: {
    user: config.MAIL_USER,
    pass: config.MAIL_PASS
  }
}

if ("MAIL_SERVICE" in config) {
  mailOptions.service = config.MAIL_SERVICE
} else {
  mailOptions.host = config.MAIL_HOST
  mailOptions.port = config.MAIL_PORT
  mailOptions.ignoreTLS = config.MAIL_IGNORE_TLS
}

const mailTransport = nodemailer.createTransport(mailOptions)

const sendMail = async function (fromEmail, toEmail, subject, html) {
  const mail = {
    to: toEmail,
    from: `${config.APP_NAME} <${fromEmail}>`,
    subject: subject,
    html: html,
    text: html.replace(/<(?:.|\n)*?>/gm, ""),
    headers: { "X-Mailjet-TrackOpen": "0", "X-Mailjet-TrackClick": "0" }
  }

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error, info) =>
      error ? reject(error) : resolve(info)
    )
  })
}

module.exports.sendEmailValidationEmail = async function(toEmail, tokenExpirationDate, url) {
  const html = `
  <p>Bonjour,</p>
  <p></p>
  <p>Cliquez sur ce lien (ou copiez le dans votre navigateur) pour obtenir les informations de connexion à votre conférence téléphonique : </p>
  <p><a href="${url}">${url}</a></p>
  <p></p>
  <p>Ce lien expirera ${format.formatFrenchDateTime(tokenExpirationDate)}.</p>
  <p></p>
  <p>Bonne journée avec ${config.APP_NAME} !</p>`

  try {
    return await sendMail(
      config.MAIL_SENDER_EMAIL,
      toEmail,
      "Confirmez la réservation de votre conférence audio",
      html,
    )
  } catch (err) {
    console.error("Erreur dans sendEmailValidationEmail", err)
    throw new Error("Erreur dans sendEmailValidationEmail")
  }
}

module.exports.sendConfWebAccessEmail = async function(
  {
    email,
    phoneNumber,
    conferenceDay,
    url,
    pin
  }
) {

const html = await ejs.renderFile(path.join(__dirname, "../views/emails/confWebAccess.ejs"), {
  HOSTNAME_WITH_PROTOCOL: config.HOSTNAME_WITH_PROTOCOL,
  APP_NAME:  config.APP_NAME,
  pin,
  formatedConferenceDayformat: conferenceDay ? format.formatFrenchDate(new Date(conferenceDay)) : "",
  phoneNumber,
  url
})

  try {
    return await sendMail(
      config.MAIL_SENDER_EMAIL,
      email,
      `CONFIDENTIEL : Lien de modération de votre conférence téléphonique ${conferenceDay ? `expirant le ${format.formatFrenchDate(new Date(conferenceDay))} ` : "" }`,
      html,
    )
  } catch (err) {
    console.error("Erreur dans sendConfWebAccessEmail", err)
    throw new Error("Erreur dans sendConfWebAccessEmail")
  }
}


module.exports.sendConfCreatedEmail = async function (
    toEmail,
    phoneNumber,
    pin,
    durationInMinutes,
    conferenceDay,
    freeAt,
    pollUrl,
    userTimezoneOffset = -60, // default : Paris winter time
  ) {
  let pollHtml = ""
  if (pollUrl) {
    pollHtml = `
    <div class="paragraph">
      <div>
        Vous avez une remarque ou une suggestion ?
        <a title="Donner mon avis" rel="noopener noreferrer nofollow" target="_blank" href="${pollUrl}">Donnez-nous votre avis sur le service</a>
      </div>
    </div>`
  }

  let expirationInfo = ""
  if (conferenceDay) {
    expirationInfo = `Ce numéro de conférence sera actif jusqu'au ${format.formatFrenchDate(new Date(conferenceDay))} et expirera à minuit heure locale (${format.GMTString(userTimezoneOffset)}).`
  } else {
    expirationInfo = `Ce numéro de conférence est actif pendant ${format.formatMinutesInHours(durationInMinutes)}. Il expirera ${format.formatFrenchDateTime(freeAt)}.`
  }

  const html = `
  <style>
    .paragraph {
      margin-top: 20px;
      margin-bottom: 30px;
    }
  </style>
  <div>Bonjour,</div>

  <div class="paragraph">
    <div>
      Votre numéro de conférence téléphonique
      <a href="${config.HOSTNAME_WITH_PROTOCOL}">${config.APP_NAME}</a>
      ${conferenceDay ? `valide jusqu'au ${format.formatFrenchDate(new Date(conferenceDay))} ` : "" }
      est réservé. Elle pourra accueillir jusqu'à 50 participants.
    </div>
    <div>Pour vous y connecter : <div>
    <ul>
      <li>appelez le <a href="tel:${phoneNumber},,${pin}"><strong>${format.formatFrenchPhoneNumber(phoneNumber)}</strong></a> (numéro non surtaxé) sur votre téléphone fixe ou mobile</li>
      <li>tapez le code d'accès à ${config.NUM_PIN_DIGITS} chiffres : <strong>${format.formatPin(pin)}</strong> et appuyez sur "#"</li>
    </ul>
  </div>

  <div class="paragraph">
    <div>${expirationInfo}</div>
  </div>

  <div class="paragraph">
    Bonne journée avec <a href="${config.HOSTNAME_WITH_PROTOCOL}">${config.APP_NAME}</a> !
  </div>

  <hr />
  ${pollHtml}
  <div>
    Créez votre propre conférence téléphonique, en toute autonomie, en allant sur
    <a href="${config.HOSTNAME_WITH_PROTOCOL}">${config.APP_NAME}</a>
  </div>
  `

  try {
    return await sendMail(
      config.MAIL_SENDER_EMAIL,
      toEmail,
      `Votre conférence téléphonique ${conferenceDay ? `expirant le ${format.formatFrenchDate(new Date(conferenceDay))} ` : "" }est réservée`,
      html,
    )
  } catch (err) {
    console.error("Erreur dans sendGenericConfCreatedEmail", err)
    throw new Error("Erreur dans sendGenericConfCreatedEmail")
  }
}

module.exports.sendSurveyEmail = async function (toEmail) {
  const html = `
  <p>Bonjour,</p>
  <p></p>
  <p>Votre réservation de numéro de conférence <b>${config.APP_NAME}</b> s'est terminée hier.<br>Avez-vous apprécié le service ?</p>

  <p>Avez-vous rencontré des difficultés qui vous ont irrité ?</p>

  <p>Nous aimerions le savoir pour nous améliorer !</p>

  <a class="fr-btn fr-btn fr-btn"
    target="_blank"
    rel="noopener"
    href="${config.AFTER_MEETING_SURVEY_URL}">
      Donnez votre avis
  </a>
  (Si votre service informatique bloque l'outil de sondage, dans ce cas, vous pouvez nous faire un retour en répondant à cet email)

  <p>À bientôt,</p>

  <p>L'équipe d'AudioConf</p>`

  try {
    return sendMail(config.MAIL_SENDER_EMAIL, toEmail, `Donner votre avis sur l'audioconférence d'hier`, html)
  } catch (err) {
    console.error(`Erreur dans sendSurveyEmail`, err)
    throw new Error("Erreur dans sendSurveyEmail")
  }
}
