const config = require('../config')
const crypto = require('crypto')
Intl = require('intl') // Use a polyfill for when node doesn't have locales installed

// OVH uses format '00339112233', we want '09 11 22 33' for humans
module.exports.formatFrenchPhoneNumber = machineReadableNumber => {
  const lastNineDigits = machineReadableNumber.slice(-9)
  const withPrefix = '0' + lastNineDigits
  const splitByPairs = withPrefix.substring(0, 2)
      + ' ' + withPrefix.substring(2, 4)
      + ' ' + withPrefix.substring(4, 6)
      + ' ' + withPrefix.substring(6, 8)
      + ' ' + withPrefix.substring(8, 10)
  return splitByPairs
}

const options = {
  weekday: 'long', year: 'numeric',
  month: 'long', day: 'numeric',
  hour: 'numeric', minute: 'numeric',
}
const dateFormatter = new Intl.DateTimeFormat('fr-FR', options)
const GMTString = date => {
  const offset = date.getTimezoneOffset()
  const GMT = (-offset/60)
  if (GMT === 0) {
    return 'GMT'
  }
  if ( GMT > 0 ) {
    return 'GMT+' + GMT
  }
  if ( GMT < 0 ) {
    return 'GMT' + GMT
  }
}
module.exports.formatFrenchDate = date => {
  return dateFormatter.format(date) + ' ' + GMTString(date)
}

const shortDateOptions = {
  month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric',
}
const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', shortDateOptions)
module.exports.formatShortFrenchDate = date => {
  return shortDateFormatter.format(date)
}

module.exports.formatMinutesInHours = minutes =>
  `${Math.floor(minutes/60)} heure${ minutes >= 120 ? 's' : ''}`

module.exports.hashForLogs = (object) => {
  const hash = crypto.createHmac('sha256', config.SECRET)
    .update(object)
    .digest('hex')
  return hash
}
