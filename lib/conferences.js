const config = require("../config")
const ovhLib = require("ovh")

let ovhRooms = ovhLib({
  appKey: config.OVH_ROOM_APP_KEY,
  appSecret: config.OVH_ROOM_APP_SECRET,
  consumerKey: config.OVH_ROOM_CONSUMER_KEY,
})

const createRoom = async () => {
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
}
// Note : expiration date must be less than 1 year in the future.
const removeRoomPinAndSetExpirationDate = async (roomNumber, freeAt) => {
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
}

module.exports.cancelRoom = async (roomNumber) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/rooms/${roomNumber}`
  // expire 10s into the future, because OVH API want expiration dates in the future.
  const expirationDate = new Date(new Date().getTime() + 10 * 1000)
  try {
    return ovhRooms.requestPromised(
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
}
module.exports.getRoomsStats = async () => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/roomsStats`
  try {
    return ovhRooms.requestPromised(
      "GET", url
    )
  } catch (err) {
    console.error(`OVH Error getRoomsStats on ${url}`, err)
    throw new Error(`OVH Error getRoomsStats on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.createConf = async (freeAt) => {
  try {
    const roomNumber = await createRoom()
    await removeRoomPinAndSetExpirationDate(roomNumber, freeAt)
    return {
      phoneNumber: config.OVH_ROOM_PHONE_NUMBER,
      pin: roomNumber,
      freeAt: freeAt,
    }
  } catch (err) {
    console.error("Impossible de génerer une nouvelle conférence Rooms", err)
    throw new Error("Impossible de génerer une nouvelle conférence Rooms")
  }
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

module.exports.getAllPhoneNumbers = async () => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference`

  try {
    const result = await ovhRooms.requestPromised("GET", url, {})
    // Filter out non-phone numbers (we have things that look like blocks : '0033111111112-21')
    return result.filter(phoneNumber => phoneNumber.length == 13)
  } catch (err) {
    console.error(`Error getAllPhoneNumbers on ${url}`, err)
    throw new Error(`Error getAllPhoneNumbers on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.getCallsForPhoneNumber = async (phoneNumber, intervalStartDateString) => {
  const intervalStartParam = intervalStartDateString ? `?dateBegin.from=${intervalStartDateString}` : ""
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/histories${intervalStartParam}`

  try {
    return await ovhRooms.requestPromised("GET", url, {})
  } catch (err) {
    console.error(`Error getCallForPhoneNumber on ${url}`, err)
    throw new Error(`Error getCallForPhoneNumber on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.getHistoryForCall = async (phoneNumber, callId) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/histories/${callId}`

  try {
    return await ovhRooms.requestPromised("GET", url, {})
  } catch (err) {
    console.error(`Error getHistoryForCall on ${url}`, err)
    throw new Error(`Error getHistoryForCall on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.getRoom = async (phoneNumber, roomNumber) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/rooms/${roomNumber}`
  try {
    return await ovhRooms.requestPromised("GET", url, {
      phoneNumber,
      roomNumber
    })
  } catch (err) {
    console.error(`Error getRoom on ${url}`, err)
    throw new Error(`Error getRoom on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.lockRoom = async (phoneNumber, roomNumber) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/rooms/${roomNumber}/lock`
  try {
    return await ovhRooms.requestPromised("POST", url, {
      phoneNumber,
      roomNumber
    })
  } catch (err) {
    console.error(`Error getRoom on ${url}`, err)
    throw new Error(`Error getRoom on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.unlockRoom = async (phoneNumber, roomNumber) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/rooms/${roomNumber}/unlock`
  try {
    return await ovhRooms.requestPromised("POST", url, {
      phoneNumber,
      roomNumber
    })
  } catch (err) {
    console.error(`Error getRoom on ${url}`, err)
    throw new Error(`Error getRoom on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.unlockRoom = async (phoneNumber, roomNumber) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/rooms/${roomNumber}/unlock`
  try {
    return await ovhRooms.requestPromised("POST", url, {
      phoneNumber,
      roomNumber
    })
  } catch (err) {
    console.error(`Error getRoom on ${url}`, err)
    throw new Error(`Error getRoom on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.getParticipants = async (phoneNumber, roomNumber) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/rooms/${roomNumber}/participants`
  try {
    return await ovhRooms.requestPromised("GET", url, {
      phoneNumber,
      roomNumber
    })
  } catch (err) {
    console.error(`Error getRoom on ${url}`, err)
    throw new Error(`Error getRoom on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.getParticipant = async (phoneNumber, roomNumber, participantId) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/rooms/${roomNumber}/participants/${participantId}`
  try {
    return await ovhRooms.requestPromised("GET", url, {
      phoneNumber,
      roomNumber
    })
  } catch (err) {
    console.error(`Error getRoom on ${url}`, err)
    throw new Error(`Error getRoom on ${url} : ${JSON.stringify(err)}`)
  }
}

module.exports.participantAction = async (phoneNumber, roomNumber, participantId, action) => {
  if (!['deaf', 'energy', 'kick', 'mute', 'undeaf', 'unmute'].includes(action)) {
    throw new Error(`${action} is not a valid participant action`)
  }
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/rooms/${roomNumber}/participants/${participantId}/${action}`
  try {
    return await ovhRooms.requestPromised("POST", url, {
      phoneNumber,
      roomNumber
    })
  } catch (err) {
    console.error(`Error getRoom on ${url}`, err)
    throw new Error(`Error getRoom on ${url} : ${JSON.stringify(err)}`)
  }
}
