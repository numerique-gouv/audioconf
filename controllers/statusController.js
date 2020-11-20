const conferences = require('../lib/conferences')
const config = require("../config")

/*
GET /status
code 200 -> tout va bien
code 500 -> erreur
*/
module.exports.getStatus = async (req, res) => {
  // todo : tester la connexion à la base de donnée
  try {
    if (config.USE_OVH_ROOM_API) {
      await conferences.getRoomsStats() // todo is this loading the API too much ? Use another query ?
    } else {
      await conferences.getAllPhoneNumbers()
    }
  } catch(err) {
    console.log('status check got error with OVH', err)
    // Do not return the error, because it contains private data.
    return res.status(500).json({ message: 'error with OVH' })
  }

  res.status(200).json({ message: 'OK' })
}