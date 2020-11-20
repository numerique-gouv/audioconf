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
    if (!config.USE_OVH_ROOM_API) {
      await conferences.getAllPhoneNumbers()
    }
  } catch(err) {
    console.log('status check got err', err)
    return res.status(500).json({ message: 'error with OVH', error: err.toString() })
  }

  res.status(200).json({ message: 'OK' })
}