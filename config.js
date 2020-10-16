const config = {}

config.PORT = process.env.PORT || 8080

if (!('APP_NAME' in process.env)) {
  config.APP_NAME = 'CoucouCollègues'
} else {
  config.APP_NAME = process.env.APP_NAME
}

if (!('MAIL_USER' in process.env) || !('MAIL_PASS' in process.env)) {
  throw new Error('Env vars MAIL_USER and MAIL_PASS should be set')
}
config.MAIL_USER = process.env.MAIL_USER
config.MAIL_PASS = process.env.MAIL_PASS

if (!('MAIL_SENDER_EMAIL' in process.env)) {
  throw new Error('Env vars MAIL_SENDER_EMAIL should be set')
}
config.MAIL_SENDER_EMAIL = process.env.MAIL_SENDER_EMAIL

if ('MAIL_SERVICE' in process.env) {
  config.MAIL_SERVICE = process.env.MAIL_SERVICE
} else {
  if (!('MAIL_HOST' in process.env) || !('MAIL_PORT' in process.env)) {
    throw new Error('When MAIL_SERVICE is set, env vars MAIL_HOST and MAIL_PORT should be set')
  }
  config.MAIL_HOST = process.env.MAIL_HOST
  config.MAIL_PORT = process.env.MAIL_PORT
}

module.exports = config