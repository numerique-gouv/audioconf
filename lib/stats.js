const conferences = require('./conferences')

/*
GET /telephony/{billingAccount}/conference/{serviceName}/informations

Ya qqn :
{
  dateStart: "2020-11-03T17:24:38+01:00"
  membersCount: 1
  locked: false
  }

Ya personne :
Not Found (404)
{ "message": "There is nobody in your conference room right now" }

Mauvais numero :
Not Found (404)
{ "message": "The requested object (serviceName = 0033999999999) does not exist" }
*/

// todo maybe rename
module.exports.getTotalOnlineParticipants = async () => {
  try {
    const phoneNumbers = await conferences.getAllPhoneNumbers()
    console.log('phoneNumbers', phoneNumbers)
    const promises = phoneNumbers.map(async phoneNumber => {
      const numberOnlineParticipants = await conferences.getNumberOnlineParticipants(phoneNumber)
      console.log(`got ${numberOnlineParticipants} in ${phoneNumber}`)
      return numberOnlineParticipants
    })
    const results = await Promise.all(promises)
    const totalOnlineParticipants = results.reduce((sum, result) => (sum + result))
    console.log('totalOnlineParticipants', totalOnlineParticipants)
    return totalOnlineParticipants
  } catch (err) {
    console.error(`Error getTotalOnlineParticipants`, err)
    throw new Error(`Error getTotalOnlineParticipants : ${JSON.stringify(err)}`)
  }
}
