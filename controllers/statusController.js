const conferences = require('../lib/conferences')
const config = require("../config")

/*
GET /status
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

  try {
    const knex = require('knex')({
      client: 'pg',
      connection: config.DATABASE_URL,
    })

    const lastMigration = await knex('knex_migrations').select()
      .orderBy('id', 'desc')
      .limit(1)
    if (lastMigration.length === 0) {
      console.error('error with DB : no migrations')
      status.DBStatus = false
    } else {
      status.DBStatus = true
    }
  } catch(err) {
    console.error('status check got error with DB', err)
    status.DBStatus = false
  }

  status.status = status.OVHStatus && status.DBStatus
  if (status.status) {
    return res.status(200).json(status)
  } else {
    return res.status(500).json(status)
  }
}
