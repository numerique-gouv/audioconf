const conferences = require("../lib/conferences")
const db = require("../lib/db")

const fetchCallIds = async (phoneNumber) => {
  const latestRecordedCall = await db.getLastSuccessfulCallStatsJob(phoneNumber)
  const intervalStartDate = latestRecordedCall ? latestRecordedCall.dateBegin.toISOString() : undefined
  console.log("Fetching calls for phone number", phoneNumber, "from", intervalStartDate, "to now")
  const callIds = await conferences.getCallsForPhoneNumber(phoneNumber, intervalStartDate)
  console.log("Got", callIds.length, "calls")
  return callIds
}

const insertCallHistory = async (history, phoneNumber, summary) => {
  const id = await db.insertCallHistory(phoneNumber, history)
  if (id) {
    console.log(`${id} inserted`)
    summary.insertedRows++
  } else {
    console.log(`${phoneNumber}_${history.id} already inserted`)
    summary.alreadyInsertedRows++
  }
}

const recordSuccessfulJob = async (phoneNumber) => {
  const lastCall = await db.getLatestCallHistory(phoneNumber)
  await db.insertLastSuccessfulCallStatsJob(phoneNumber, lastCall)
}

module.exports = async () => {
  console.debug("Start of fetchCallsStats job")

  try {
    var runWithoutErrors = true
    const phoneNumbers = await conferences.getAllPhoneNumbers()
    console.log("Got", phoneNumbers.length, "phone numbers.")
    if (!phoneNumbers.length) {
      console.log("No numbers found. Check your configuration.")
      process.exit(1)
    }

    const summary = {
      phoneNumbersLength: phoneNumbers.length,
      insertedRows: 0,
      alreadyInsertedRows: 0,
    }

    const sortedPhoneNumbers = phoneNumbers.sort()

    for (const phoneNumber of sortedPhoneNumbers) {
      const callIds = await fetchCallIds(phoneNumber)

      for (const callId of callIds) {
        try {
          const history = await conferences.getHistoryForCall(phoneNumber, callId)
          await insertCallHistory(history, phoneNumber, summary)
        } catch(err) {
          console.error("fetchCallsStats: error with callId",callId," ", err)
          runWithoutErrors = false
        }
      }

      if(runWithoutErrors) {
        // Record that this batch of inserts was successful
        await recordSuccessfulJob(phoneNumber)
      } else {
        console.error("fetchCallsStats: sucessfullJob not recorded for number=",phoneNumber)
      }
    }

    console.dir({ summary })

    console.debug("End of fetchCallsStats job.")
    return summary
  } catch(err) {
    console.error("fetchCallsStats job abort on error", err)
    process.exit(1)
  }
}
