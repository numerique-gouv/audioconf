const config = require('../config')
const db = require('../lib/db')

const ovhLib = require('ovh')

const ovh = ovhLib({
  appKey: config.OVH_APP_KEY,
  appSecret: config.OVH_APP_SECRET,
  consumerKey: config.OVH_CONSUMER_KEY,
})

let ovhRooms = null
if (config.USE_OVH_ROOM_API) {
  ovhRooms = ovhLib({
    appKey: config.OVH_ROOM_APP_KEY,
    appSecret: config.OVH_ROOM_APP_SECRET,
    consumerKey: config.OVH_ROOM_CONSUMER_KEY,
  })
}

const OVHAPIHelper = {
  getNumberOnlineParticipants: async (phoneNumber) => {
    const url = `/telephony/${config.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/informations`

    try {
      const result = await ovh.requestPromised('GET', url, {})
      return result.membersCount
    } catch (err) {
      // When no one is in a call, OVH returns 404. But it could also be that the number doesn't exist.
      if (err.error === 404) {
        return 0
      }
      console.log(`Error in getNumberOnlineParticipants for ${phoneNumber}`, err)
      throw new Error(`Error in getNumberOnlineParticipants for ${phoneNumber} : ${JSON.stringify(err)}`)
    }
  },

  getAllPhoneNumbers : async () => {
    const url = `/telephony/${config.OVH_ACCOUNT_NUMBER}/conference`

    try {
      const result = await ovh.requestPromised('GET', url, {})
      // Filter out non-phone numbers (we have things that look like blocks : '0033111111112-21')
      return result.filter(phoneNumber => phoneNumber.length == 13)
    } catch (err) {
      console.error(`Error getAllPhoneNumbers on ${url}`, err)
      throw new Error(`Error getAllPhoneNumbers on ${url} : ${JSON.stringify(err)}`)
    }
  },

  changePin: async (phoneNumber, newPin) => {
    const url = `/telephony/${config.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/settings`
    try {
      return await ovh.requestPromised('PUT', url, {
        pin : newPin,
        recordStatus: false,
        reportStatus: "none"
      });
    } catch (err) {
      console.error(`OVH Error changePin on ${url}`, err)
      throw new Error(`OVH Error changePin on ${url} : ${JSON.stringify(err)}`);
    }
  },

  kickAllParticipants: async phoneNumber => {
    try {
      const participantIds = await OVHAPIHelper.getParticipantIds(phoneNumber)
      return Promise.all(participantIds.map(participantId => OVHAPIHelper.kickParticipant(phoneNumber, participantId)))
    } catch (err) {
      console.error(`OVH Error kickAllParticipants on ${url}`, err)
      throw new Error(`OVH Error kickAllParticipants on ${url} : ${JSON.stringify(err)}`);
    }
  },

  kickParticipant: async (phoneNumber, participantId) => {
    try {
      return ovh.requestPromised(
        'POST',
        `/telephony/${config.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/participants/${participantId}/kick`,
      )
    } catch (err) {
      console.error(`OVH Error kickParticipant on ${url}`, err)
      throw new Error(`OVH Error kickParticipant on ${url} : ${JSON.stringify(err)}`);
    }
  },

  getParticipantIds: async (phoneNumber) => {
    try {
      return ovh.requestPromised(
        'GET',
        `/telephony/${config.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/participants`,
      )
    } catch (err) {
      console.error(`OVH Error getParticipantIds on ${url}`, err)
      throw new Error(`OVH Error getParticipantIds on ${url} : ${JSON.stringify(err)}`);
    }
  }
}

const OVHRoomApiHelper = {
  createRoom: async () => {
    const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/rooms`
    try {
      const result = await ovhRooms.requestPromised(
        'POST',
        url,
      )
      return result.roomNumber
    } catch (err) {
      console.error(`OVH Error createRoom on ${url}`, err)
      throw new Error(`OVH Error createRoom on ${url} : ${JSON.stringify(err)}`);
    }
  },
  // Note : expiration date must be less than 1 year in the future.
  removeRoomPinAndSetExpirationDate: async (roomNumber, freeAt) => {
    const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/rooms/${roomNumber}`
    try {
      await ovhRooms.requestPromised(
        'PUT',
        url,
        {
          pin: '0',
          expirationDate: freeAt,
        }
      )
      return freeAt
    } catch (err) {
      console.error(`OVH Error removeRoomPin on ${url}`, err)
      throw new Error(`OVH Error removeRoomPin on ${url} : ${JSON.stringify(err)}`);
    }
  },
  cancelRoom: async (roomNumber) => {
    const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/rooms/${roomNumber}`
    // expire 10s into the future, because OVH API want expiration dates in the future.
    const expirationDate = new Date(new Date().getTime() + 10 * 1000)
    try {
      return await ovhRooms.requestPromised(
        'PUT',
        url,
        {
          expirationDate: expirationDate,
        }
      )
    } catch (err) {
      console.error(`OVH Error cancelRoom on ${url}`, err)
      throw new Error(`OVH Error cancelRoom on ${url} : ${JSON.stringify(err)}`);
    }
  },
  getRoomsStats: async () => {
    const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/roomsStats`
    try {
      return await ovhRooms.requestPromised(
        'GET', url
      )
    } catch (err) {
      console.error(`OVH Error getRoomsStats on ${url}`, err)
      throw new Error(`OVH Error getRoomsStats on ${url} : ${JSON.stringify(err)}`);
    }
  },
}

const conferences = {
  createConfWithNumbersApi: async (freeAt) => {
    const generatePin = numDigits => {
      return Math.floor(Math.random() * Math.pow(10, numDigits)).toString().padStart(numDigits, '0')
    }
    try {
      const phoneNumberData = await db.bookNextFreePhoneNumber(freeAt)
      const phoneNumber = phoneNumberData.phoneNumber
      const pin = generatePin(config.NUM_PIN_DIGITS)
      const resultPin = await OVHAPIHelper.changePin(phoneNumber, pin)
      const resultKick = await OVHAPIHelper.kickAllParticipants(phoneNumber)

      return Promise.resolve({ phoneNumber: phoneNumber, pin: pin, freeAt: phoneNumberData.freeAt })
    } catch (err) {
      console.error(`Impossible de génerer une nouvelle conférence`, err)
      throw new Error(`Impossible de génerer une nouvelle conférence`, err);
    }
  },
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
      console.error(`Impossible de génerer une nouvelle conférence Rooms`, err)
      throw new Error(`Impossible de génerer une nouvelle conférence Rooms`);
    }
  },
}

module.exports.createConf = async (freeAt) => {
  if (config.USE_OVH_ROOM_API) {
    return conferences.createConfWithRoomsApi(freeAt)
  }
  return conferences.createConfWithNumbersApi(freeAt)
}
module.exports.getAllPhoneNumbers = OVHAPIHelper.getAllPhoneNumbers
module.exports.getNumberOnlineParticipants = OVHAPIHelper.getNumberOnlineParticipants

module.exports.cancelRoom = OVHRoomApiHelper.cancelRoom
module.exports.getRoomsStats = OVHRoomApiHelper.getRoomsStats