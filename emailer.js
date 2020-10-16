const nodemailer = require('nodemailer')
const config = require('./config')


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

module.exports.sendConfCreatedEmail = async function(toEmail, confPhoneNumber, confId) {
  const html = `
  <p>Bonjour,</p>
  <p></p>
  <p>Votre conférence est bien créée.</p>
  <p>Pour vous y connecter : <p>
  <ul>
    <li>appelez le <strong>${confPhoneNumber}</strong> sur votre téléphone pro ou perso</li>
    <li>tapez le numéro de conférence à 6 chiffres : <strong>${confId}</strong>, puis appuyez sur "#"</li>
  </ul>
  <p style="color: #b60000;">LA CONF NE MARCHE PAS POUR DE VRAI POUR LE MOMENT, CE SITE EST ENCORE UNE DEMO</p>
  <p></p>
  <p>Bonne journée avec ${config.APP_NAME} !</p>`

  return sendMail(
    config.MAIL_SENDER_EMAIL,
    toEmail,
    'Votre conférence est créée',
    html,
  )
}