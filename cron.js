const cron = require('cron');
const stats = require('./lib/stats')

const updateStatsJob = new cron.CronJob({
  cronTime: '* * * * *',
  onTick: async () =>  {
    const startDate = new Date()
    await stats.computeStats()
    const endDate = new Date()
  },
  start: true,
  timeZone: 'Europe/Paris'
});

console.log('Started 1 cron jobs')
