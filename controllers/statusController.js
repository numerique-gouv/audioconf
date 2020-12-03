const conferences = require('../lib/conferences')
const config = require("../config")
const db = require('../lib/db')

/*
GET /api/status
code 200 -> all is well
code 500 -> error
*/
module.exports.getStatus = async (req, res) => {
  const status = {
    USE_OVH_ROOM_API : config.USE_OVH_ROOM_API,
    FEATURE_DISPLAY_STATS_ON_LANDING : config.FEATURE_DISPLAY_STATS_ON_LANDING,
    FEATURE_RESERVATIONS : config.FEATURE_RESERVATIONS,
    FEATURE_STATS_PAGE : config.FEATURE_STATS_PAGE,
    version: require('../package').version,
  }

  try {
    if (config.USE_OVH_ROOM_API) {
      await conferences.getRoomsStats()
    } else {
      await conferences.getAllPhoneNumbers()
    }
    status.OVHStatus = true
  } catch(err) {
    console.error('status check got error with OVH', err)
    // Do not return the error, because it contains private data.
    status.OVHStatus = false
  }

  status.DBStatus = (await db.getDBStatus())

  status.status = status.OVHStatus && status.DBStatus
  const statusCode = status.status ? 200 : 500
  return res.status(statusCode).json(status)
}
