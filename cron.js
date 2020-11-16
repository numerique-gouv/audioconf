const cron = require('cron');
const stats = require('./lib/stats')

const updateStatsJob = new cron.CronJob({
  cronTime: '*/2 * * * *',
  onTick: async () =>  {
    await stats.computeStats()
  },
  start: true,
  timeZone: 'Europe/Paris'
});

console.log('Started 1 cron jobs')
