const conferences = require('../lib/conferences')
const config = require("../config")
const knex = require('knex')({
  client: 'pg',
  connection: config.DATABASE_URL,
});


/*
GET /status
code 200 -> all is well
code 500 -> error
*/
module.exports.getStatus = async (req, res) => {
  try {
    if (config.USE_OVH_ROOM_API) {
      await conferences.getRoomsStats()
    } else {
      await conferences.getAllPhoneNumbers()
    }
  } catch(err) {
    console.error('status check got error with OVH', err)
    // Do not return the error, because it contains private data.
    return res.status(500).json({ message: 'error with OVH' })
  }

  try {
    const lastMigration = await knex('knex_migrations').select()
      .orderBy('id', 'desc')
      .limit(1)
    if (lastMigration.length === 0) {
      console.error('DB contains no migrations')
      return res.status(500).json({ message: 'error with DB : no migrations' })
    }
  } catch(err) {
    console.error('status check got error with DB', err)
    return res.status(500).json({ message: 'error with DB' })
  }

  res.status(200).json({ message: 'OK' })
}