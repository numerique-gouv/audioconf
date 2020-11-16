const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.email_whitelist' })

const config = {}

config.PORT = process.env.PORT || 8080
config.PROTOCOL = process.env.PROTOCOL || "https"

const isPresent = varName => {
  if (varName in process.env && process.env[varName].trim() !== '') {
    return true
  }
  return false
}

config.APP_NAME = process.env.APP_NAME || 'CoucouCollègues'


if (!isPresent('MAIL_USER') || !isPresent('MAIL_PASS')) {
  throw new Error('Env vars MAIL_USER and MAIL_PASS should be set')
}
config.MAIL_USER = process.env.MAIL_USER
config.MAIL_PASS = process.env.MAIL_PASS

if (!isPresent('MAIL_SENDER_EMAIL')) {
  throw new Error('Env vars MAIL_SENDER_EMAIL should be set')
}
config.MAIL_SENDER_EMAIL = process.env.MAIL_SENDER_EMAIL


if (isPresent('MAIL_SERVICE')) {
  config.MAIL_SERVICE = process.env.MAIL_SERVICE
} else {
  if (!isPresent('MAIL_HOST') || !isPresent('MAIL_PORT')) {
    throw new Error('When MAIL_SERVICE is not set, env vars MAIL_HOST and MAIL_PORT should be set')
  }
  config.MAIL_HOST = process.env.MAIL_HOST
  config.MAIL_PORT = process.env.MAIL_PORT
  config.MAIL_IGNORE_TLS = (process.env.MAIL_IGNORE_TLS === 'true')
}

if (isPresent('EMAIL_WHITELIST')) {
  config.EMAIL_WHITELIST = process.env.EMAIL_WHITELIST.split(",").map(string => new RegExp(string))
} else {
  config.EMAIL_WHITELIST = [/.*/]
}

if (!isPresent('OVH_APP_KEY') || !isPresent('OVH_APP_SECRET') || !isPresent('OVH_CONSUMER_KEY') || !isPresent('OVH_ACCOUNT_NUMBER')) {
  throw new Error('OVH is not set correctly')
}
config.OVH_APP_KEY = process.env.OVH_APP_KEY
config.OVH_APP_SECRET = process.env.OVH_APP_SECRET
config.OVH_CONSUMER_KEY = process.env.OVH_CONSUMER_KEY
config.OVH_ACCOUNT_NUMBER = process.env.OVH_ACCOUNT_NUMBER

config.USE_OVH_ROOM_API = (process.env.USE_OVH_ROOM_API === 'true') || false
if (config.USE_OVH_ROOM_API) {
  if (!isPresent('OVH_ROOM_APP_KEY') ||
    !isPresent('OVH_ROOM_APP_SECRET') ||
    !isPresent('OVH_ROOM_CONSUMER_KEY') ||
    !isPresent('OVH_ROOM_ACCOUNT_NUMBER') ||
    !isPresent('OVH_ROOM_PHONE_NUMBER')) {
    throw new Error('OVH Rooms API is not set up correctly')
  }
  config.OVH_ROOM_APP_KEY = process.env.OVH_ROOM_APP_KEY
  config.OVH_ROOM_APP_SECRET = process.env.OVH_ROOM_APP_SECRET
  config.OVH_ROOM_CONSUMER_KEY = process.env.OVH_ROOM_CONSUMER_KEY
  config.OVH_ROOM_ACCOUNT_NUMBER = process.env.OVH_ROOM_ACCOUNT_NUMBER
  config.OVH_ROOM_PHONE_NUMBER = process.env.OVH_ROOM_PHONE_NUMBER
}


if (!isPresent('DATABASE_URL')) {
  throw new Error('Env vars DATABASE_URL should be set')
}
config.DATABASE_URL = process.env.DATABASE_URL


config.NUM_PIN_DIGITS = process.env.NUM_PIN_DIGITS || (config.USE_OVH_ROOM_API ? 9 : 4)
config.CONFERENCE_MAX_DURATION_IN_MINUTES = process.env.CONFERENCE_MAX_DURATION_IN_MINUTES || 1440
config.TOKEN_DURATION_IN_MINUTES = process.env.TOKEN_DURATION_IN_MINUTES || 120
config.POLL_URL = process.env.POLL_URL

config.SECRET = process.env.SECRET

config.SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.MAIL_SENDER_EMAIL

if (!isPresent('TZ')) {
  process.env.TZ = 'Europe/Paris'
}
console.log('Using timezone', process.env.TZ)

config.RESERVE_NUM_DAYS_AHEAD = process.env.RESERVE_NUM_DAYS_AHEAD || 14

/* Feature flags */
config.FEATURE_DISPLAY_STATS_ON_LANDING = (process.env.FEATURE_DISPLAY_STATS_ON_LANDING === 'true') || false
config.FEATURE_STATS_PAGE = (process.env.FEATURE_STATS_PAGE === 'true') || false
config.FEATURE_RESERVATIONS = (process.env.FEATURE_RESERVATIONS === 'true') || false

module.exports = config
