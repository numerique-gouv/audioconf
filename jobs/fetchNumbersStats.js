const dotenv = require("dotenv")
const ovhLib = require("ovh")

const getAllPhoneNumbers = async (ovh) => {
  const url = `/telephony/${process.env.OVH_ACCOUNT_NUMBER}/conference`

  try {
    const result = await ovh.requestPromised("GET", url, {})
    // Filter out non-phone numbers (we have things that look like blocks : '0033111111112-21')
    return result.filter(phoneNumber => phoneNumber.length == 13)
  } catch (err) {
    console.error(`Error getAllPhoneNumbers on ${url}`, err)
    throw new Error(`Error getAllPhoneNumbers on ${url} : ${JSON.stringify(err)}`)
  }
}

const getCallsForPhoneNumber = async (ovh, phoneNumber) => {
  const url = `/telephony/${process.env.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/histories`

  try {
    return await ovh.requestPromised("GET", url, {})
  } catch (err) {
    console.error(`Error getCallForPhoneNumber on ${url}`, err)
    throw new Error(`Error getCallForPhoneNumber on ${url} : ${JSON.stringify(err)}`)
  }
}

const getHistoryForCall = async (ovh, phoneNumber, callId) => {
  const url = `/telephony/${process.env.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/histories/${callId}`

  try {
    return await ovh.requestPromised("GET", url, {})
  } catch (err) {
    console.error(`Error getHistoryForCall on ${url}`, err)
    throw new Error(`Error getHistoryForCall on ${url} : ${JSON.stringify(err)}`)
  }
}

const insertHistoryInDb = async(knex, phoneNumber, history) => {
  try {
    return await knex("calls").insert({
      phoneNumber: phoneNumber,
      callId: history.id,
      dateBegin: history.dateBegin,
      dateEnd: history.dateEnd,
      countParticipants: history.countParticipants,
      countConnections: history.countConnections,
      durationMinutes: history.duration,
    })
  } catch (err) {
    console.error("insertHistoryInDb error", err)
  }
}

module.exports = async () => {
  console.debug("Start of fetchNumbersStats job")

  // Fetch env vars from config file
  dotenv.config({ path: ".env" })

  const ovh = ovhLib({
    appKey: process.env.OVH_APP_KEY,
    appSecret: process.env.OVH_APP_SECRET,
    consumerKey: process.env.OVH_CONSUMER_KEY,
  })

  const knex = require("knex")({
    client: "pg",
    connection: process.env.STATS_DATABASE_URL,
    acquireConnectionTimeout: 10000,
  })

  // todo create db if not exists

  const phoneNumbers = await getAllPhoneNumbers(ovh)
  console.log("Got", phoneNumbers.length)

  for (const phoneNumber of phoneNumbers.slice(0, 5)) {
    const callIds = await getCallsForPhoneNumber(ovh, phoneNumber)
    console.log("Got", callIds.length, "calls for", phoneNumber)

    for (const callId of callIds.slice(0, 5)) {
      const history = await getHistoryForCall(ovh, phoneNumber, callId)
      console.log("Got history for", phoneNumber, callId, ", countParticipants", history.countParticipants)
      //  await insertHistoryInDb(knex, phoneNumber, history)
    }

  }

}
