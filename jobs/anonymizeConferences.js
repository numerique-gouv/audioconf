const db = require("../lib/db")

module.exports = async () => {
  console.debug("Start of anonymisation job")
  try {
    const conferences = await db.anonymizeConferences()
    console.log("Conferences modifiées", conferences)
  } catch (error) {
    console.error("Error during anonymization", error)
  }
  console.debug("End of anonymisation job")
}
