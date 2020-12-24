const dotenv = require("dotenv")
const ovhLib = require("ovh")

const db = require("../lib/db")
const config = require("../config")

// Fetch env vars from config file
dotenv.config({ path: ".env" })

// TODO: move these 3 functions in conferences.js when there will be no more fetch of data for old API
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

module.exports = async () => {
  console.debug("Start of fetchOVHStats job")

  const JOB_DRY_RUN = process.env.JOB_DRY_RUN === "true"
  console.log("Dry run :", JOB_DRY_RUN)

  const STATS_SMALL_RUN = process.env.STATS_SMALL_RUN === "true"
  console.log("Small run :", STATS_SMALL_RUN)

  // TODO: remove the old API credentials
  let ovhClient = config.USE_OVH_ROOM_API
    ? ovhLib({
      appKey: config.OVH_ROOM_APP_KEY,
      appSecret: config.OVH_ROOM_APP_SECRET,
      consumerKey: config.OVH_ROOM_CONSUMER_KEY,
    })
    : ovhLib({
      appKey: process.env.OVH_APP_KEY,
      appSecret: process.env.OVH_APP_SECRET,
      consumerKey: process.env.OVH_CONSUMER_KEY,
    })

  let callsInsertedCounter = 0
  let phoneNumbersDoneCounter = 0

  const phoneNumbers = await getAllPhoneNumbers(ovhClient)
  console.log("phoneNumbers.length", phoneNumbers.length)

  if (!phoneNumbers.length) {
    console.log("No numbers found. Check your configuration.")
    process.exit(1)
  }

  const numPhoneNumbersToRun = STATS_SMALL_RUN ? 2 : phoneNumbers.length

  // We sort the numbers, so the test on a subset of number will always return the same number.
  const sortedPhoneNumbers = phoneNumbers.sort()

  for (const phoneNumber of sortedPhoneNumbers.slice(0, numPhoneNumbersToRun)) {
    const callIds = await getCallsForPhoneNumber(ovhClient, phoneNumber)

    for (const callId of callIds) {
      const history = await getHistoryForCall(ovhClient, phoneNumber, callId)
      // console.log(`Got history for ${phoneNumber} : callId = ${callId}, countParticipants = ${history.countParticipants}`)
      if (JOB_DRY_RUN) {
        console.log("DRY RUN no db insert")
      } else {
        const id = await db.insertCallHistory(phoneNumber, history)
        if (id) {
          console.log(`${id} inserted`)
        } else {
          console.log(`${phoneNumber}_${history.id} already inserted`)
        }
      }
      callsInsertedCounter++
    }
    phoneNumbersDoneCounter++
    // console.log(phoneNumbersDoneCounter, "phoneNumbers done. Inserted", callsInsertedCounter, "call histories in db.")
  }

  console.log(`Total : ${phoneNumbersDoneCounter} phoneNumbers done. Inserted ${callsInsertedCounter} call histories in db.`)
  console.debug("End of fetchOVHStats job.")
  process.exit()
}
