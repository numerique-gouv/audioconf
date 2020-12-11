const db = require("../lib/db")

// Job à lancer 1x pour initialiser
module.exports = async () => {
  console.debug("Start of hashed emails job")

  try {
    const conferences = await db.getConferencesWithNoHashedEmails()

    console.debug(`Number of emails which have to have hashed emails : ${conferences.length || 0}`)

    const updateQueries = conferences.map((conference) => db.updateHashedEmail(conference))

    await Promise.all(updateQueries)
      .then((queries) => console.log(`${queries.length} hashed emails updated`))
      .catch((error) => console.error(error))

    console.debug("End of hashed emails job")
  } catch (error) {
    console.error("Error during hashed emails", error)
  }
}
