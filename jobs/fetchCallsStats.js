const conferences = require("../lib/conferences")
const db = require("../lib/db")

module.exports = async () => {
  console.debug("Start of fetchCallsStats job")

  const JOB_DRY_RUN = process.env.JOB_DRY_RUN === "true"
  console.log("Dry run :", JOB_DRY_RUN)

  const JOB_CALLS_STATS_SMALL_RUN = process.env.JOB_CALLS_STATS_SMALL_RUN === "true"
  console.log("Small run :", JOB_CALLS_STATS_SMALL_RUN)

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

  // We sort the numbers, so event in "small test", the job will always use the same numbers.
  const sortedPhoneNumbers = phoneNumbers.sort()

  const numPhoneNumbersToRun = JOB_CALLS_STATS_SMALL_RUN ? 2 : phoneNumbers.length

  for (const phoneNumber of sortedPhoneNumbers.slice(0, numPhoneNumbersToRun)) {
    const latestRecordedCall = await db.getLastSuccessfulCallStatsJob(phoneNumber)
    const intervalStartDate = latestRecordedCall ? latestRecordedCall.dateBegin.toISOString() : undefined

    console.log("Fetching calls for phone number", phoneNumber, "from", intervalStartDate, "to now")
    const callIds = await conferences.getCallsForPhoneNumber(phoneNumber, intervalStartDate)
    console.log("Got", callIds.length, "calls")

    for (const callId of callIds) {
      const history = await conferences.getHistoryForCall(phoneNumber, callId)

      if (JOB_DRY_RUN) {
        console.log(`${history.id} not inserted, dry run`)
        summary.insertedRows++
      } else {
        const id = await db.insertCallHistory(phoneNumber, history)
        if (id) {
          console.log(`${id} inserted`)
          summary.insertedRows++
        } else {
          console.log(`${phoneNumber}_${history.id} already inserted`)
          summary.alreadyInsertedRows++
        }
      }
    }

    // Record that this batch of inserts was successful
    const lastCall = await db.getLatestCallHistory(phoneNumber)
    await db.insertLastSuccessfulCallStatsJob(phoneNumber, lastCall)
  }

  console.dir({ summary })

  console.debug("End of fetchCallsStats job.")
}
