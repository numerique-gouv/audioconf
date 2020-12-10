const db = require('../lib/db')

// Note : if called for a conf created with Rooms API, this will do nothing.
module.exports.cancelConf = async (req, res) => {
  const confId = req.params.id
  try {
    const conference = await db.cancelConference(confId)
    req.flash('info', 'La conférence a bien été annulée. Si vous avez encore besoin d\'une conférence, vous pouvez en créer une nouvelle.')
    console.log(`La conférence ${confId} a été annulée`)
    return res.redirect('/')
  } catch (err) {
    req.flash('error', 'Une erreur s\'est produite pendant l\'annulation de la conférence.')
    console.error('Erreur pour annuler la conférence', err)
    return res.redirect('/')
  }
}
