const dotenv = require("dotenv")
dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.email_whitelist" })

const config = {}

config.NODE_ENV = process.env.NODE_ENV || "production"
config.PORT = process.env.PORT || 8080

const isPresent = varName => {
  if (varName in process.env && process.env[varName].trim() !== "") {
    return true
  }
  return false
}

config.APP_NAME = process.env.APP_NAME || "CoucouCollègues"

config.HOSTNAME_WITH_PROTOCOL = process.env.HOSTNAME_WITH_PROTOCOL || `http://localhost:${config.PORT}`

if (!isPresent("MAIL_USER") || !isPresent("MAIL_PASS")) {
  throw new Error("Env vars MAIL_USER and MAIL_PASS should be set")
}
config.MAIL_USER = process.env.MAIL_USER
config.MAIL_PASS = process.env.MAIL_PASS

if (!isPresent("MAIL_SENDER_EMAIL")) {
  throw new Error("Env vars MAIL_SENDER_EMAIL should be set")
}
config.MAIL_SENDER_EMAIL = process.env.MAIL_SENDER_EMAIL


if (isPresent("MAIL_SERVICE")) {
  config.MAIL_SERVICE = process.env.MAIL_SERVICE
} else {
  if (!isPresent("MAIL_HOST") || !isPresent("MAIL_PORT")) {
    throw new Error("When MAIL_SERVICE is not set, env vars MAIL_HOST and MAIL_PORT should be set")
  }
  config.MAIL_HOST = process.env.MAIL_HOST
  config.MAIL_PORT = process.env.MAIL_PORT
  config.MAIL_IGNORE_TLS = (process.env.MAIL_IGNORE_TLS === "true")
}

if (isPresent("EMAIL_WHITELIST")) {
  config.EMAIL_WHITELIST = process.env.EMAIL_WHITELIST.split(",").map(string => new RegExp(string))
} else {
  config.EMAIL_WHITELIST = [/.*/]
}

if (isPresent("EMAIL_WEB_ACCESS_WHITELIST")) {
  config.EMAIL_WEB_ACCESS_WHITELIST= process.env.EMAIL_WEB_ACCESS_WHITELIST.split(",").map(string => new RegExp(string))
} else {
  config.EMAIL_WEB_ACCESS_WHITELIST = [/.*/]
}


if (
  !isPresent("OVH_ROOM_APP_KEY") ||
  !isPresent("OVH_ROOM_APP_SECRET") ||
  !isPresent("OVH_ROOM_CONSUMER_KEY") ||
  !isPresent("OVH_ROOM_ACCOUNT_NUMBER") ||
  !isPresent("OVH_ROOM_PHONE_NUMBER")
) {
  throw new Error("OVH Rooms API is not set up correctly")
}

config.OVH_ROOM_APP_KEY = process.env.OVH_ROOM_APP_KEY
config.OVH_ROOM_APP_SECRET = process.env.OVH_ROOM_APP_SECRET
config.OVH_ROOM_CONSUMER_KEY = process.env.OVH_ROOM_CONSUMER_KEY
config.OVH_ROOM_ACCOUNT_NUMBER = process.env.OVH_ROOM_ACCOUNT_NUMBER
config.OVH_ROOM_PHONE_NUMBER = process.env.OVH_ROOM_PHONE_NUMBER


if (!isPresent("DATABASE_URL")) {
  throw new Error("Env vars DATABASE_URL should be set")
}
config.DATABASE_URL = process.env.DATABASE_URL

config.NUM_PIN_DIGITS = process.env.NUM_PIN_DIGITS ||  9
config.CONFERENCE_MAX_DURATION_IN_MINUTES = process.env.CONFERENCE_MAX_DURATION_IN_MINUTES || 1440
config.TOKEN_DURATION_IN_MINUTES = process.env.TOKEN_DURATION_IN_MINUTES || 120
config.POLL_URL = process.env.POLL_URL
config.AFTER_MEETING_SURVEY_URL = process.env.AFTER_MEETING_SURVEY_URL

config.SECRET = process.env.SECRET
config.ENCRYPT_SECRET = process.env.ENCRYPT_SECRET

config.SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.MAIL_SENDER_EMAIL

if (!isPresent("TZ")) {
  process.env.TZ = "Europe/Paris"
}
console.log("Using timezone", process.env.TZ)

config.RESERVE_NUM_DAYS_AHEAD = process.env.RESERVE_NUM_DAYS_AHEAD || 14

/* Feature flags */
config.FEATURE_DISPLAY_STATS_ON_LANDING = (process.env.FEATURE_DISPLAY_STATS_ON_LANDING === "true") || false
config.FEATURE_STATS_PAGE = (process.env.FEATURE_STATS_PAGE === "true") || false
config.FEATURE_RESERVATIONS = (process.env.FEATURE_RESERVATIONS === "true") || false
config.FEATURE_JOB_COMPUTE_STATS = process.env.FEATURE_JOB_COMPUTE_STATS === "true" || false
config.FEATURE_JOB_ANONYMIZE_EMAILS = process.env.FEATURE_JOB_ANONYMIZE_EMAILS === "true" || false
config.FEATURE_JOB_CALLS_STATS = process.env.FEATURE_JOB_CALLS_STATS === "true" || false
config.FEATURE_WEB_ACCESS = process.env.FEATURE_WEB_ACCESS === "true" || false
config.FEATURE_OIDC = process.env.FEATURE_OIDC === "true" || false

config.ANNOUNCEMENTS = process.env.ANNOUNCEMENTS ? process.env.ANNOUNCEMENTS.split("|") : []

config.STATS_EXTERNAL_DASHBOARD_URL = process.env.STATS_EXTERNAL_DASHBOARD_URL


config.OIDC_PROVIDER_URL = process.env.OIDC_PROVIDER_URL
config.OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID
config.OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET
config.OIDC_ACR_VALUES = process.env.OIDC_ACR_VALUES
config.OIDC_ID_TOKEN_SIGNED_ALG = process.env.OIDC_ID_TOKEN_SIGNED_ALG
config.OIDC_USER_INFO_SIGNED_ALG = process.env.OIDC_USER_INFO_SIGNED_ALG

config.RIZOMO_URI = process.env.RIZOMO_URI

module.exports = config
