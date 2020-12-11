const db = require("../lib/db")
const { sendSurveyEmail } = require("../lib/emailer")
const config = require("../config")

module.exports = async () => {
  console.debug("Start of sendSurveyEmails job")

  if (!config.SURVEY_URL) {
    console.log("No survey to send.")
    return
  }

  try {
    const emails = await db.getEmailsForSurvey()

    console.debug(`Number of surveys to send : ${emails.length || 0}`)

    let nbEmails = 0

    async function runJob({ email, hashedEmail }) {
      console.log("🚀 email", email)
      console.log("🚀 hashedEmail", hashedEmail)
      await sendSurveyEmail(email)
      await db.fillSurveyDateConference(hashedEmail)
      nbEmails++
    }

    const emailsToSend = emails.map((emails) => runJob(emails))

    await Promise.all(emailsToSend)

    console.debug(`Number of sent surveys :`, nbEmails)
    console.debug("End of sendSurveyEmails job")
  } catch (error) {
    console.error("Error during sendSurveyEmails", error)
  }
}
