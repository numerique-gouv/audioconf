const db = require("../lib/db")

module.exports = async () => {
  try {
    console.debug("Start of anonymisation job")
    const conferences = await db.anonymizeConferences()
    console.debug("End of anonymisation job")
    return conferences

  } catch (error) {
    console.error("Error during anonymization", error)
  }
}
