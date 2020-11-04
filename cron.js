const cron = require('cron');
const stats = require('./lib/stats')

const updateStatsJob = new cron.CronJob({
  cronTime: '* * * * *',
  onTick: async () =>  {
    const startDate = new Date()
    console.log(startDate,'updateStatsJob ticked')
    await stats.computeStats()
    const endDate = new Date()
    console.log(endDate,'updateStatsJob end')
  },
  start: true,
  timeZone: 'Europe/Paris'
});

console.log('Started 1 cron jobs')