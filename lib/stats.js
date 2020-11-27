const config = require('../config')
const conferences = require('./conferences')
const db = require('./db')
const format = require('./format')


const getOnlineParticipantStatsWithRooms = async () => {
  const stats = await conferences.getRoomsStats()
  return {
    onlineParticipantsCount: stats.participantsCount,
    activeConfsCount: stats.activeRoomsCount,
    errorConfsCount: 0, // the API doesn't return errors for individual rooms.
    bookedRoomsCount: stats.roomsCount,
    USE_OVH_ROOM_API: true,
  }
}

const getOnlineParticipantStatsWithNumbers = async () => {
  try {
    const confs = await conferences.getAllPhoneNumbers()
    console.log(`stats got ${confs.length} confs`)

    const promises = confs.map(async conf => {
      try {
        return await conferences.getNumberOnlineParticipants(conf)
      } catch (err) {
        console.log(`Error in conferences.getNumberOnlineParticipants for ${conf}`, err)
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

    const freePhoneNumbersCount = await db.getFreePhoneNumbersCount()
    const phoneNumbersCount = await db.getPhoneNumbersCount()
    totals.freePhoneNumbersCount = freePhoneNumbersCount
    totals.phoneNumbersCount = phoneNumbersCount

    totals.USE_OVH_ROOM_API = config.USE_OVH_ROOM_API
    return totals
  } catch (err) {
    console.error(`Error getOnlineParticipantStatsWithNumbers`, err)
    throw new Error(`Error getOnlineParticipantStatsWithNumbers : ${JSON.stringify(err)}`)
  }
}

module.exports.computeStats = async () => {
  try {
    let statsPoint = {}
    if (config.USE_OVH_ROOM_API) {
      statsPoint = await getOnlineParticipantStatsWithRooms()
    } else {
      statsPoint = await getOnlineParticipantStatsWithNumbers()
    }
    console.log('stats', statsPoint)

    db.insertStatsPoint(statsPoint)
  } catch (err) {
    console.error(`Could not compute stats.`, err)
  }
}

/**
 * inData coming from db is like :
 * [{"date":"2020-11-05T14:11:00.440Z",
 *   "USE_OVH_ROOM_API:": true/false,
 *   "onlineParticipantsCount":0,
 *   "activeConfsCount":0,
 *   "errorConfsCount":0,
 *   "bookedRoomsCount":0, // if rooms API
 *   "freePhoneNumbersCount":9, // if numbers API
 *   "phoneNumbersCount":10 // if numbers API
 *   },
 *   {...},
 * ...]
 *
 * outData is formatted like :
 * {
 *   labels: [dates],
 *   onlineParticipantsSeries: [series],
 *   activeConfsSeries: [series],
 *   freePhoneNumbersSeries: [series],
 *   phoneNumbersSeries: [series],
 *   bookedPhoneNumbersSeries: [series],
 *   bookedRoomsSeries: [series],
 *  }
 */
module.exports.formatDataForDisplay = (inData) => {
  const outData = {
    labels: [],
    onlineParticipantsSeries: [],
    activeConfsSeries: [],
    USE_OVH_ROOM_API: config.USE_OVH_ROOM_API,
  }
  if (config.USE_OVH_ROOM_API) {
    outData.bookedRoomsSeries = []
  } else {
    outData.freePhoneNumbersSeries = []
    outData.phoneNumbersSeries = []
    outData.bookedPhoneNumbersSeries = []
  }
  inData.forEach(dataPoint => {
    // Use unshift to add at the beginning of array, because the inData is in reverse chronological order.
    outData.labels.unshift(format.formatShortFrenchDate(new Date(dataPoint.date)))
    outData.onlineParticipantsSeries.unshift(dataPoint.onlineParticipantsCount)
    outData.activeConfsSeries.unshift(dataPoint.activeConfsCount)

    // Don't display any data when the count is negative, it means there is no value.
    if (config.USE_OVH_ROOM_API) {
      if (dataPoint.bookedRoomsCount < 0) {
        outData.bookedRoomsSeries.unshift(null)
      } else {
        outData.bookedRoomsSeries.unshift(dataPoint.bookedRoomsCount)
      }
    } else {
      if (dataPoint.freePhoneNumbersCount < 0) {
        outData.freePhoneNumbersSeries.unshift(null)
      } else {
        outData.freePhoneNumbersSeries.unshift(dataPoint.freePhoneNumbersCount)
      }
      if (dataPoint.phoneNumbersCount < 0) {
        outData.phoneNumbersSeries.unshift(null)
      } else {
        outData.phoneNumbersSeries.unshift(dataPoint.phoneNumbersCount)
      }
      if (dataPoint.phoneNumbersCount >= 0 && dataPoint.freePhoneNumbersCount >= 0) {
        outData.bookedPhoneNumbersSeries.unshift(dataPoint.phoneNumbersCount - dataPoint.freePhoneNumbersCount)
      } else {
        outData.bookedPhoneNumbersSeries.unshift(null)
      }
    }
  })
  return outData
}
