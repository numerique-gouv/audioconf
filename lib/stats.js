const conferences = require("./conferences")
const db = require("./db")
const format = require("./format")


const getOnlineParticipantStatsWithRooms = async () => {
  const stats = await conferences.getRoomsStats()
  return {
    onlineParticipantsCount: stats.participantsCount,
    activeConfsCount: stats.activeRoomsCount,
    errorConfsCount: 0, // the API doesn't return errors for individual rooms.
    bookedRoomsCount: stats.roomsCount,
  }
}

module.exports.computeStats = async () => {
  try {
    let statsPoint = {}
    statsPoint = await getOnlineParticipantStatsWithRooms()

    console.log("stats", statsPoint)

    db.insertStatsPoint(statsPoint)
  } catch (err) {
    console.error("Could not compute stats.", err)
  }
}

/**
 * inData coming from db is like :
 * [{"date":"2020-11-05T14:11:00.440Z",
 *   "onlineParticipantsCount":0,
 *   "activeConfsCount":0,
 *   "bookedRoomsCount":0, // if rooms API
 *   },
 *   {...},
 * ...]
 *
 * outData is formatted like :
 * {
 *   labels: [dates],
 *   onlineParticipantsSeries: [series],
 *   activeConfsSeries: [series],
 *   bookedRoomsSeries: [series],
 *  }
 */
module.exports.formatDataForDisplay = (inData) => {
  const outData = {
    labels: [],
    onlineParticipantsSeries: [],
    activeConfsSeries: [],
    bookedRoomsSeries: []
  }

  inData.forEach(dataPoint => {
    // Use unshift to add at the beginning of array, because the inData is in reverse chronological order.
    outData.labels.unshift(format.formatShortFrenchDate(new Date(dataPoint.date)))
    outData.onlineParticipantsSeries.unshift(dataPoint.onlineParticipantsCount)
    outData.activeConfsSeries.unshift(dataPoint.activeConfsCount)

    // Don't display any data when the count is negative, it means there is no value.
    if (dataPoint.bookedRoomsCount < 0) {
      outData.bookedRoomsSeries.unshift(null)
    } else {
      outData.bookedRoomsSeries.unshift(dataPoint.bookedRoomsCount)
    }
  })
  return outData
}
