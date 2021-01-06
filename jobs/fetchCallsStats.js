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

  for (const number of sortedPhoneNumbers.slice(0, numPhoneNumbersToRun)) {
    const callIds = await conferences.getCallsForPhoneNumber(number)
    console.log("Got", callIds.length, "calls for phone number", number)

    for (const callId of callIds) {
      const history = await conferences.getHistoryForCall(number, callId)

      if (JOB_DRY_RUN) {
        console.log(`${history.id} not inserted, dry run`)
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

  console.debug("End of fetchCallsStats job.")
}
