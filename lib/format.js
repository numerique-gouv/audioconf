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

var options = { weekday: 'long', year: 'numeric',
                 month: 'long', day: 'numeric',
                 hour: 'numeric', minute: 'numeric'}
var dateFormatter = new Intl.DateTimeFormat('fr-FR', options)
module.exports.formatFrenchDate = date => dateFormatter.format(date)

module.exports.formatMinutesInHours = minutes => 
  `${minutes/60} heure${ minutes >= 120 ? 's' : ''}`