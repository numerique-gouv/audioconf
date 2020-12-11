const cron = require("cron")
const stats = require("./lib/stats")
const db = require("./lib/db")
const anonymizeConferences = require("./jobs/anonymizeConferences")
const sendSurveyEmails = require("./jobs/sendSurveyEmails")
const computeStats = require("./jobs/computeStats")
const config = require("./config")

const jobs = [
  {
    cronTime: "*/2 * * * *", // every two minutes
    onTick: computeStats,
    start: true,
    timeZone: "Europe/Paris",
    isActive: config.FEATURE_JOB_COMPUTE_STATS,
    name: "Compute stats",
  },
  {
    cronTime: "15 0 * * *", // everyday at 00:15
    onTick: anonymizeConferences,
    start: true,
    timeZone: "Europe/Paris",
    isActive: config.FEATURE_JOB_ANONYMIZE_EMAILS,
    name: "Anonymize emails",
  },
  {
    cronTime: "30 8 * * *", // everyday at 08:30
    onTick: sendSurveyEmails,
    start: true,
    timeZone: "Europe/Paris",
    isActive: Boolean(config.AFTER_MEETING_SURVEY_URL),
    name: "Send survey emails",
  },
]

let activeJobs = 0

for (const job of jobs) {
  if (job.isActive) {
    console.log(`🚀 The job "${job.name}" is ON`)
    const currentJob = new cron.CronJob(job)
    activeJobs++
  } else {
    console.log(`❌ The job "${job.name}" is OFF`)
  }
}

console.log(`Started ${activeJobs} cron jobs`)
