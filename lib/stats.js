const conferences = require('./conferences')
const db = require('./db')
const format = require('./format')

const getOnlineParticipantStats = async () => {
  try {
    const phoneNumbers = await conferences.getAllPhoneNumbers()
    console.log(`stats got ${phoneNumbers.length} phoneNumbers`)

    const promises = phoneNumbers.map(async phoneNumber => {
      try {
        return await conferences.getNumberOnlineParticipants(phoneNumber)
      } catch (err) {
        console.log(`Error in getNumberOnlineParticipants for ${phoneNumber}`, err)
        return err
      }
    })
    const results = await Promise.all(promises)

    const totals = results.reduce((totals, numberOnlineParticipants) => {
      if (typeof numberOnlineParticipants === 'number') {
        totals.onlineParticipantsCount += numberOnlineParticipants
        totals.activeConfsCount += (numberOnlineParticipants > 0) ? 1 : 0
        return totals
      }
      totals.errorConfsCount += 1
      return totals
    }, { onlineParticipantsCount: 0, activeConfsCount: 0, errorConfsCount: 0})

    console.log('stats', totals)
    return totals
  } catch (err) {
    console.error(`Error getTotalOnlineParticipants`, err)
    throw new Error(`Error getTotalOnlineParticipants : ${JSON.stringify(err)}`)
  }
}

module.exports.computeStats = async () => {
  try {
    const statsPoint = await getOnlineParticipantStats()
    const freePhoneNumbersCount = await db.getFreePhoneNumbersCount()
    statsPoint.freePhoneNumbersCount = freePhoneNumbersCount
    db.insertStatsPoint(statsPoint)
} catch (err) {
    console.error(`Could not compute stats.`, err)
  }
}

/**
 * inData coming from db is like :
 * [{"date":"2020-11-05T14:11:00.440Z","onlineParticipantsCount":0,"activeConfsCount":0,"errorConfsCount":0}, {...}, ...]
 * outData is formatted like :
 * { labels: [dates], onlineParticipantsSeries: [series], activeConfsSeries: [series] }
 */
module.exports.formatDataForDisplay = (inData) => {
  const outData = { labels: [], onlineParticipantsSeries: [], activeConfsSeries: [] }
  inData.forEach(dataPoint => {
    // Use unshift to add at the beginning of array, because the inData is in reverse chronological order.
    outData.labels.unshift(format.formatShortFrenchDate(new Date(dataPoint.date)))
    outData.onlineParticipantsSeries.unshift(dataPoint.onlineParticipantsCount)
    outData.activeConfsSeries.unshift(dataPoint.activeConfsCount)
  })
  return outData
}
