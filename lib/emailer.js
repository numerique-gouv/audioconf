const nodemailer = require('nodemailer')

const config = require('../config')
const format = require('./format')
const urls = require('../urls')

const mailOptions = {
  debug: true,
  auth: {
    user: config.MAIL_USER,
    pass: config.MAIL_PASS
  }
}

if ('MAIL_SERVICE' in config) {
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
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' }
  };

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error, info) =>
      error ? reject(error) : resolve(info)
    );
  });
}

module.exports.sendEmailValidationEmail = async function(toEmail, token, tokenExpirationDate, url) {
  const html = `
  <p>Bonjour,</p>
  <p></p>
  <p>Cliquez sur ce lien (ou copiez le dans votre navigateur) pour passer à l'étape suivante de création de conférence : </p>
  <p><a href="${url}">${url}</a></p>
  <p></p>
  <p>Ce lien est actif pendant ${config.TOKEN_DURATION_IN_MINUTES} minutes. Il expirera ${format.formatFrenchDate(tokenExpirationDate)}.</p>
  <p></p>
  <p>Bonne journée avec ${config.APP_NAME} !</p>`

  try {
    return await sendMail(
      config.MAIL_SENDER_EMAIL,
      toEmail,
      'Votre lien de confirmation',
      html,
    )
  } catch (err) {
    console.error(`Erreur dans sendEmailValidationEmail`, err)
    throw new Error('Erreur dans sendEmailValidationEmail')
  }
}

module.exports.sendConfCreatedEmail = async function(toEmail, phoneNumber, pin, durationInMinutes, freeAt, confUrl) {
  const html = `
  <style>
    .paragraph {
      margin-top: 20px;
      margin-bottom: 30px;
    }
  </style>
  <div>Bonjour,</div>

  <div class="paragraph">
    <div>Votre conférence est bien créée.</div>
    <div>Pour vous y connecter : <div>
    <ul>
      <li>appelez le <a href="tel:${phoneNumber},,${pin}"><strong>${format.formatFrenchPhoneNumber(phoneNumber)}</strong></a> sur votre téléphone pro ou perso</li>
      <li>tapez le code d'accès à ${config.NUM_PIN_DIGITS} chiffres : <strong>${pin}</strong></li>
    </ul>
  </div>

  <div class="paragraph">
    <div>Ce numéro de conférence est actif pendant ${format.formatMinutesInHours(durationInMinutes)}. Il expirera ${format.formatFrenchDate(freeAt)}.</div>
    <div>Il peut accueillir jusqu'à 50 personnes.</div>
    </div>

  <div class="paragraph">
    <div>Vous n'allez pas utiliser ce numéro de conférence ? <strong>Annulez-la</strong>, pour que le numéro puisse être récyclé :</div>
    <div>
      <a href="${confUrl}">${confUrl}</a>.config.NUM_PIN_DIGITS
    </div>
  </div>

  <div class="paragraph">
    Bonne journée avec ${config.APP_NAME} !
  </div>`

  try {
    return await sendMail(
      config.MAIL_SENDER_EMAIL,
      toEmail,
      'Votre conférence est créée',
      html,
    )
  } catch (err) {
    console.error(`Erreur dans sendConfCreatedEmail`, err)
    throw new Error('Erreur dans sendConfCreatedEmail')
  }
}
