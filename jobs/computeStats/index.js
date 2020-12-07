const stats = require("../../lib/stats")

module.exports = async () =>  {
  await stats.computeStats()
}