const nodemailer = require('nodemailer')
const config = require('../config')


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

module.exports.sendConfCreatedEmail = async function(toEmail, confPhoneNumber, pin) {
  const html = `
  <p>Bonjour,</p>
  <p></p>
  <p>Votre conférence est bien créée.</p>
  <p>Pour vous y connecter : <p>
  <ul>
    <li>appelez le <strong>${confPhoneNumber}</strong> sur votre téléphone pro ou perso</li>
    <li>tapez le numéro de conférence à ${config.NUM_PIN_DIGITS} chiffres : <strong>${pin}</strong></li>
  </ul>
  <p></p>
  <p>Cette conférence est active pendant ${config.CONFERENCE_DURATION_IN_MINUTES} minutes. Elle peut accueillir jusqu'à 50 personnes.</p>
  <p></p>
  <p>Bonne journée avec ${config.APP_NAME} !</p>`

  return sendMail(
    config.MAIL_SENDER_EMAIL,
    toEmail,
    'Votre conférence est créée',
    html,
  )
}