const cron = require('cron');
const stats = require('./lib/stats')
const db = require('./lib/db')
const anonymizeConferences = require("./jobs/anonymizeConferences")
const computeStats = require("./jobs/computeStats")

const updateStatsJob = new cron.CronJob({
  cronTime: '*/2 * * * *',
  onTick: computeStats,
  start: true,
  timeZone: 'Europe/Paris'
});

const anonymizeConferencesJob = new cron.CronJob({
  cronTime: '* * * * *', // everyday at 00:15
  onTick: anonymizeConferences,
  start: true,
  timeZone: 'Europe/Paris'
});

console.log('Started 2 cron jobs')