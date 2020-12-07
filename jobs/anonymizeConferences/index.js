const db = require("../../lib/db")

module.exports = async () => {
  console.debug("Start of anonymisation job")
  await db.anonymizeConferences()
  console.debug("End of anonymisation job")
}
