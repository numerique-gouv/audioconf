const db = require("../lib/db")
const { sendSurveyEmail } = require("../lib/emailer")
const config = require("../config")

module.exports = async () => {
  console.debug("Start of sendSurveyEmails job")

  if (!config.AFTER_MEETING_SURVEY_URL) {
    console.log("No survey to send.")
    return
  }

  try {
    const emails = await db.getEmailsForSurvey()

    console.debug(`Number of surveys to send : ${emails.length || 0}`)

    let nbEmails = 0

    const emailsToSend = emails.map(async ({ email, hashedEmail }) => {
      await sendSurveyEmail(email)
      await db.recordSurveySentAt(hashedEmail)
      nbEmails++
    })

    await Promise.all(emailsToSend)

    console.debug(`Number of sent surveys :`, nbEmails)
    console.debug("End of sendSurveyEmails job")
  } catch (error) {
    console.error("Error during sendSurveyEmails", error)
  }
}
