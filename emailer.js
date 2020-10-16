const nodemailer = require('nodemailer')

const appName = 'CoucouCollègues' // Todo config

const mailTransport = nodemailer.createTransport({
  debug: true,
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendMail = async function (fromEmail, toEmail, subject, html) {
  const mail = {
    to: toEmail,
    from: `${appName} <${fromEmail}>`,
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
  <p>Bonne journée avec ${appName} !</p>`

  return sendMail(
    process.env.MAIL_USER,
    toEmail,
    'Votre conférence est créée',
    html,
  )
}