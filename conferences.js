// Todo query backend for conf number and id
module.exports.createConf = async email => {
  const generateInteger = numDigits => {
    return Math.floor(Math.random() * Math.pow(10, numDigits))
  }
  const confPhoneNumber = '0' + generateInteger(9)
  const confId = generateInteger(6)

  return Promise.resolve({ phoneNumber: confPhoneNumber, id: confId})
}