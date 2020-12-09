const db = require("../lib/db")

module.exports = async () => {
  console.debug("Start of anonymisation job")
  try {
    await db.anonymizeConferences()
  } catch (error) {
    console.error("Error during anonymization", error)
  }
  console.debug("End of anonymisation job")
}
