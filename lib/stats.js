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


Erreur rencontrée, lorsque 4 personnes dans la conf, puis 2 (tjs erreur), puis 1 (tjs erreur)
Tout le monde est sorti.
Puis 1 personne rentrée : plus d'erreur. Puis resortie, rerentrée (5 fois) : plus d'erreur.
Error in getNumberOnlineParticipants for 00331XXXXXXXX {
error: 400,
message: '[(informations return)] Missing properties: (dateStart, locked) for type ConferenceInformations'
}

*/

module.exports.getOnlineParticipantStats = async () => {
  try {
    const phoneNumbers = await conferences.getAllPhoneNumbers()
    console.log('phoneNumbers', phoneNumbers)

    const promises = phoneNumbers.map(async phoneNumber => {
      try {
        const numberOnlineParticipants = await conferences.getNumberOnlineParticipants(phoneNumber)
        console.log(`got ${numberOnlineParticipants} in ${phoneNumber}`)
        return numberOnlineParticipants
      } catch (err) {
        return err
      }
    })
    const results = await Promise.all(promises)

    const totals = results.reduce((totals, numberOnlineParticipants) => {
      if (typeof numberOnlineParticipants === 'number') {
        totals.totalOnlineParticipants += numberOnlineParticipants
        totals.totalActiveConfs += (numberOnlineParticipants > 0) ? 1 : 0
        return totals
      }
      totals.totalErrorConfs += 1
      return totals
    }, { totalOnlineParticipants: 0, totalActiveConfs: 0, totalErrorConfs: 0})
    console.log('stats', totals)
    return totals
  } catch (err) {
    console.error(`Error getTotalOnlineParticipants`, err)
    throw new Error(`Error getTotalOnlineParticipants : ${JSON.stringify(err)}`)
  }
}
