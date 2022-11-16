const cron = require("cron")
const anonymizeConferences = require("./jobs/anonymizeConferences")
const sendSurveyEmails = require("./jobs/sendSurveyEmails")
const computeStats = require("./jobs/computeStats")
const fetchCallsStats = require("./jobs/fetchCallsStats.js")
const fetchSurveyMarks = require("./jobs/fetchSurveyMarks")
const config = require("./config")

const jobs = [
  {
    cronTime: "* * * * *", // every minutes
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
  {
    cronTime: "0 1 * * *", // everyday at 01:00 AM
    onTick: fetchCallsStats,
    start: true,
    timeZone: "Europe/Paris",
    isActive: config.FEATURE_JOB_CALLS_STATS,
    name: "Fetch statistics from past calls from OVH",
  },
  {
    cronTime: "59 23 * * *", // everyday at 23:59 PM
    onTick: fetchSurveyMarks,
    start: true,
    timeZone: "Europe/Paris",
    isActive: config.FEATURE_JOB_FETCH_MARKS,
    name: "Fetch summary marks from surveys",
  },
]

let activeJobs = 0

for (const job of jobs) {
  if (job.isActive) {
    console.log(`🚀 The job "${job.name}" is ON`)
    new cron.CronJob(job)
    activeJobs++
  } else {
    console.log(`❌ The job "${job.name}" is OFF`)
  }
}

console.log(`Started ${activeJobs} cron jobs`)
