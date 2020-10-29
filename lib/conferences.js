const config = require('../config')
const db = require('../lib/db')

const ovh = require('ovh')({
  appKey: config.OVH_APP_KEY,
  appSecret: config.OVH_APP_SECRET,
  consumerKey: config.OVH_CONSUMER_KEY,
})


const OVHAPIHelper = {
  getAllPhoneNumbers : async () => {
    const url = '/telephony/aliases'

    try {
      const result = await ovh.requestPromised('GET', url, {})
      // Filter out non-phone numbers (we have things that look like blocks : '0033111111112-21')
      return result.filter(phoneNumber => phoneNumber.length == 13)
      //TODO : check that numbers are configurated for conferences
    } catch (err) {
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`)
    }
  },

  changePin: async (phoneNumber, newPin) => {
    const url = `/telephony/${config.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/settings`
    try {
      return await ovh.requestPromised('PUT', url, { pin : newPin });
    } catch (err) {
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },

  kickAllParticipants: async phoneNumber => {
    try {
      const participantIds = await OVHAPIHelper.getParticipantIds(phoneNumber)
      return Promise.all(participantIds.map(participantId => OVHAPIHelper.kickParticipant(phoneNumber, participantId)))
    } catch (err) {
      throw new Error(`OVH Error GET on kickAllParticipants ${url} : ${JSON.stringify(err)}`);
    }
  },

  kickParticipant: async (phoneNumber, participantId) => {
    try {
      return ovh.requestPromised(
        'POST',
        `/telephony/${config.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/participants/${participantId}/kick`,
      )
    } catch (err) {
      throw new Error(`OVH Error POST on kickParticipant ${url} : ${JSON.stringify(err)}`);
    }
  },

  getParticipantIds: async (phoneNumber) => {
    try {
      return ovh.requestPromised(
        'GET',
        `/telephony/${config.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/participants`,
      )
    } catch (err) {
      throw new Error(`OVH Error GET on getParticipantIds ${url} : ${JSON.stringify(err)}`);
    }
  }
}

const conferences = {
  createConf: async email => {
    const generatePin = numDigits => {
      return Math.floor(Math.random() * Math.pow(10, numDigits))
    }
    try {
      const phoneNumberData = await db.bookNextFreePhoneNumber()
      const phoneNumber = phoneNumberData.phoneNumber
      const pin = generatePin(config.NUM_PIN_DIGITS)
      const resultPin = await OVHAPIHelper.changePin(phoneNumber, pin)
      const resultKick = await OVHAPIHelper.kickAllParticipants(phoneNumber)

      return Promise.resolve({ phoneNumber: phoneNumber, pin: pin})
    } catch (err) {
      console.log("Impossible de génerer une nouvelle conférence", err)
      throw new Error(`Impossible de génerer une nouvelle conférence`, err);
    }
  }
}

module.exports.createConf = conferences.createConf
module.exports.getAllPhoneNumbers = OVHAPIHelper.getAllPhoneNumbers
