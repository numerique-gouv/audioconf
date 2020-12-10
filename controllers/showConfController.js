const db = require('../lib/db')
const format = require('../lib/format')


module.exports.showConf = async (req, res) => {
  const confId = req.params.id

  try {
    const conference = await db.getUnexpiredConference(confId)

    if (!conference) {
      req.flash('error', 'La conférence a expiré. Vous pouvez recréer une conférence.')
      return res.redirect('/')
    }

    if (conference.canceledAt) {
      req.flash('error', `La conférence a été annulée le ${format.formatFrenchDateTime(conference.canceledAt)}.
        Si vous avez encore besoin d\'une conférence, vous pouvez en créer une nouvelle.`)
      return res.redirect('/')
    }

    // Whether this conf was booked for the whole day.
    conference.isDayConference = false
    if (!conference.durationInMinutes) {
      conference.isDayConference = true
    }

    res.render('confCreated', {
      pageTitle: 'Votre conférence',
      conference
    })
  } catch (error) {
    req.flash('error', 'La conférence a expiré. Vous pouvez recréer une conférence.')
    console.error('showConf error', error)
    return res.redirect('/')
  }
}
