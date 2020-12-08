const db = require("../lib/db")
const { sendSurveyEmail } = require("../lib/emailer")
const config = require("../config")

module.exports = async () => {
  console.debug("Start of sendSurveyEmails job")

  if (!config.POLL_URL) {
    console.log("No survey to send.")
    return
  }

  try {
    const emails = await db.getEmailsFromLast24hConferences()

    console.debug(`Number of surveys to send : ${emails.length || 0}`)

    const emailsToSend = emails.map((email) => sendSurveyEmail(email))

    const nbMails = await Promise.all(emailsToSend)

    console.debug("End of sendSurveyEmails job")
  } catch (error) {
    console.error("Error during sendSurveyEmails", error)
  }
}
