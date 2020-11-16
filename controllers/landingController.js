const config = require('../config')
const db = require('../lib/db')
const format = require('../lib/format')

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
  const phoneNumbers = await db.getPhoneNumberList()
  const now = new Date()
  const numberOfFreePhoneNumbers = phoneNumbers.filter(phoneNumber => phoneNumber.freeAt < now).length
  const nextFreePhoneNumberAt = phoneNumbers[0] ? phoneNumbers[0].freeAt : new Date()

  let statsPoint = {}
  let displayStats = config.FEATURE_DISPLAY_STATS_ON_LANDING
  if (displayStats) {
    try {
      statsPoint = (await db.getLatestStatsPoints(1))[0]
      if (areStatsTooOldToDiplay(statsPoint)) {
        console.log('Stats too old to display, stats date is', statsPoint.date)
        displayStats = false
      }
    } catch (err) {
      console.error(`Impossible de récupérer le statsPoint, donc on ne l'affiche pas.`, err)
      displayStats = false
    }
  }

  // We allow booking a conf config.RESERVE_NUM_DAYS_AHEAD days in the future.
  const incrementDate = date => {
    return new Date(date.setDate(date.getDate() + 1))
  }
  const dateChoices = []
  let date = new Date()
  dateChoices.push({ label: 'Aujourd\'hui', value: format.formatStandardDate(date) })
  date = incrementDate(date)
  dateChoices.push({ label: 'Demain', value: format.formatStandardDate(date) })

  const numOtherDates = (config.RESERVE_NUM_DAYS_AHEAD - 2) > 0 ? (config.RESERVE_NUM_DAYS_AHEAD - 2) : 0
  for (let i = 0 ; i < numOtherDates; i++) {
    date = incrementDate(date)
    dateChoices.push({
      label: format.formatFrenchDate(date),
      value: format.formatStandardDate(date),
    })
  }

  res.render('landing', {
    NUM_PIN_DIGITS: config.NUM_PIN_DIGITS,
    numberOfFreePhoneNumbers: numberOfFreePhoneNumbers,
    nextFreePhoneNumberAt: nextFreePhoneNumberAt,
    CONFERENCE_MAX_DURATION_IN_MINUTES: config.CONFERENCE_MAX_DURATION_IN_MINUTES,
    FEATURE_DISPLAY_STATS_ON_LANDING: displayStats,
    onlineParticipantsCount: statsPoint.onlineParticipantsCount,
    activeConfsCount: statsPoint.activeConfsCount,
    dateChoices: dateChoices,
    FEATURE_RESERVATIONS: config.FEATURE_RESERVATIONS,
  })
}
