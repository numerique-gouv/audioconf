const cron = require('cron');
const stats = require('./lib/stats')
const db = require('./lib/db')

const updateStatsJob = new cron.CronJob({
  cronTime: '*/2 * * * *',
  onTick: async () =>  {
    await stats.computeStats()
  },
  start: true,
  timeZone: 'Europe/Paris'
});

const updateAnonymizeEmails = new cron.CronJob({
  cronTime: '0 15 * * *', // everyday at 00:15
  onTick: async () =>  {
    console.debug("Start of anonymisation cron job")
    await db.anonymizeConferences()
    console.debug("End of anonymisation cron job")
  },
  start: true,
  timeZone: 'Europe/Paris'
});

console.log('Started 2 cron jobs')