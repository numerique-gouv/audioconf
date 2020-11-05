const config = require('../config')
const db = require('../lib/db')

const areStatsTooOldToDiplay = stats => {
  const STATS_MAX_AGE_MINUTES = 5
  const cutoffDate = new Date()
  cutoffDate.setMinutes(cutoffDate.getMinutes() - STATS_MAX_AGE_MINUTES)
  if (stats.date < cutoffDate) {
    return true
  }
  return false
}

module.exports.getLanding = async (req, res) => {
  const freeNumbers = await db.getPhoneNumberList()
  const now = new Date()
  const numberOfFreePhoneNumbers = freeNumbers.filter(phoneNumber => phoneNumber.freeAt < now).length
  const nextFreePhoneNumberAt = freeNumbers[0] ? freeNumbers[0].freeAt : new Date()

  let statsPoint = {}
  let displayStats = config.FEATURE_DISPLAY_STATS_ON_LANDING
  if (displayStats) {
    try {
      statsPoint = await db.getLatestStatsPoint()
      if (areStatsTooOldToDiplay(statsPoint)) {
        console.log('Stats too old to display, stats date is', statsPoint.date)
        displayStats = false
      }
    } catch (err) {
      console.error(`Impossible de récupérer le statsPoint, donc on ne l'affiche pas.`, err)
      displayStats = false
    }
  }

  res.render('landing', {
    NUM_PIN_DIGITS: config.NUM_PIN_DIGITS,
    numberOfFreePhoneNumbers: numberOfFreePhoneNumbers,
    nextFreePhoneNumberAt: nextFreePhoneNumberAt,
    CONFERENCE_MAX_DURATION_IN_MINUTES: config.CONFERENCE_MAX_DURATION_IN_MINUTES,
    FEATURE_DISPLAY_STATS_ON_LANDING: displayStats,
    onlineParticipantsCount: statsPoint.onlineParticipantsCount,
    activeConfsCount: statsPoint.activeConfsCount,
  })
}
