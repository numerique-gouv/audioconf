const dotenv = require("dotenv")
const ovhLib = require("ovh")

const db = require("../lib/db")
const config = require("../config")

// Fetch env vars from config file
dotenv.config({ path: ".env" })

// TODO: move these 3 functions in conferences.js when there will be no more fetch of data for old API
const getAllPhoneNumbers = async (ovh) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference`

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
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/histories`

  try {
    return await ovh.requestPromised("GET", url, {})
  } catch (err) {
    console.error(`Error getCallForPhoneNumber on ${url}`, err)
    throw new Error(`Error getCallForPhoneNumber on ${url} : ${JSON.stringify(err)}`)
  }
}

const getHistoryForCall = async (ovh, phoneNumber, callId) => {
  const url = `/telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${phoneNumber}/histories/${callId}`

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

  const ovhClient = ovhLib({
      appKey: config.OVH_ROOM_APP_KEY,
      appSecret: config.OVH_ROOM_APP_SECRET,
      consumerKey: config.OVH_ROOM_CONSUMER_KEY,
    })

  const phoneNumbers = await getAllPhoneNumbers(ovhClient)

  if (!phoneNumbers.length) {
    console.log("No numbers found. Check your configuration.")
    process.exit(1)
  }

  const summary = {
    phoneNumbersLength: phoneNumbers.length,
    insertedRows: 0,
    alreadyInsertedRows: 0,
  }

  // We sort the numbers, so event in "small test", the job will always use the same numbers.
  const sortedPhoneNumbers = phoneNumbers.sort()

  const numPhoneNumbersToRun = STATS_SMALL_RUN ? 2 : phoneNumbers.length

  for (const number of sortedPhoneNumbers.slice(0, numPhoneNumbersToRun)) {
    const callIds = await getCallsForPhoneNumber(ovhClient, number)

    for (const callId of callIds) {
      const history = await getHistoryForCall(ovhClient, number, callId)

      if (JOB_DRY_RUN) {
        summary.insertedRows++
      } else {
        const id = await db.insertCallHistory(number, history)
        if (id) {
          console.log(`${id} inserted`)
          summary.insertedRows++
        } else {
          console.log(`${number}_${history.id} already inserted`)
          summary.alreadyInsertedRows++
        }
      }

    }
  }

  console.dir({ summary })

  console.debug("End of fetchOVHStats job.")
  process.exit()
}
