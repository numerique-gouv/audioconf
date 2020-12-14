const config = require("../config")
const ovhLib = require("ovh")

let ovhRooms = ovhLib({
  appKey: config.OVH_ROOM_APP_KEY,
  appSecret: config.OVH_ROOM_APP_SECRET,
  consumerKey: config.OVH_ROOM_CONSUMER_KEY,
})

const OVHRoomApiHelper = {
  createRoom: async () => {
    const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/rooms`
    try {
      const result = await ovhRooms.requestPromised(
        "POST",
        url,
      )
      return result.roomNumber
    } catch (err) {
      console.error(`OVH Error createRoom on ${url}`, err)
      throw new Error(`OVH Error createRoom on ${url} : ${JSON.stringify(err)}`)
    }
  },
  // Note : expiration date must be less than 1 year in the future.
  removeRoomPinAndSetExpirationDate: async (roomNumber, freeAt) => {
    const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/rooms/${roomNumber}`
    try {
      await ovhRooms.requestPromised(
        "PUT",
        url,
        {
          pin: "0",
          expirationDate: freeAt,
          recordStatus: false,
          reportStatus: "none"
        }
      )
      return freeAt
    } catch (err) {
      console.error(`OVH Error removeRoomPin on ${url}`, err)
      throw new Error(`OVH Error removeRoomPin on ${url} : ${JSON.stringify(err)}`)
    }
  },
  cancelRoom: async (roomNumber) => {
    const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/rooms/${roomNumber}`
    // expire 10s into the future, because OVH API want expiration dates in the future.
    const expirationDate = new Date(new Date().getTime() + 10 * 1000)
    try {
      return await ovhRooms.requestPromised(
        "PUT",
        url,
        {
          expirationDate: expirationDate,
        }
      )
    } catch (err) {
      console.error(`OVH Error cancelRoom on ${url}`, err)
      throw new Error(`OVH Error cancelRoom on ${url} : ${JSON.stringify(err)}`)
    }
  },
  getRoomsStats: async () => {
    const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/roomsStats`
    try {
      return await ovhRooms.requestPromised(
        "GET", url
      )
    } catch (err) {
      console.error(`OVH Error getRoomsStats on ${url}`, err)
      throw new Error(`OVH Error getRoomsStats on ${url} : ${JSON.stringify(err)}`)
    }
  },
}

const conferences = {
  createConfWithRoomsApi: async (freeAt) => {
    try {
      const roomNumber = await OVHRoomApiHelper.createRoom()
      await OVHRoomApiHelper.removeRoomPinAndSetExpirationDate(roomNumber, freeAt)
      return {
        phoneNumber: config.OVH_ROOM_PHONE_NUMBER,
        pin: roomNumber,
        freeAt: freeAt,
      }
    } catch (err) {
      console.error("Impossible de génerer une nouvelle conférence Rooms", err)
      throw new Error("Impossible de génerer une nouvelle conférence Rooms")
    }
  },
}

// Compute the conf expiration date : 23:59:59, in the user's timezone.
module.exports.computeConfExpirationDate = (conferenceDayString, userTimezoneOffset) => {
  const expirationTimeString = "23:59:59"
  const timestampForMidnightUTC = Date.parse(`${conferenceDayString} ${expirationTimeString} GMT`)

  // Note : userTimezoneOffset is in minutes (e.g. -60 for GMT+1), while timestamps are in milliseconds.
  const timestampForMidnightInUserTimezone = timestampForMidnightUTC + userTimezoneOffset * 60 * 1000

  const freeAt = new Date(timestampForMidnightInUserTimezone)
  return freeAt
}

module.exports.createConf = async (freeAt) => {
  return conferences.createConfWithRoomsApi(freeAt)
}

module.exports.cancelRoom = OVHRoomApiHelper.cancelRoom
module.exports.getRoomsStats = OVHRoomApiHelper.getRoomsStats
