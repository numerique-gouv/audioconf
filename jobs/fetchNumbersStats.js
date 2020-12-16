const dotenv = require("dotenv")
const ovhLib = require("ovh")

const getAllPhoneNumbers = async (ovh) => {
  const url = `/telephony/${process.env.OVH_ACCOUNT_NUMBER}/conference`

  try {
    const result = await ovh.requestPromised("GET", url, {})
    // Filter out non-phone numbers (we have things that look like blocks : '0033111111112-21')
    return result.filter(phoneNumber => phoneNumber.length == 13)
  } catch (err) {
    console.error(`Error getAllPhoneNumbers on ${url}`, err)
    throw new Error(`Error getAllPhoneNumbers on ${url} : ${JSON.stringify(err)}`)
  }
}

const getCallsForPhoneNumber = async (ovh, phoneNumber) => {
  const url = `/telephony/${process.env.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/histories`

  try {
    return await ovh.requestPromised("GET", url, {})
  } catch (err) {
    console.error(`Error getCallForPhoneNumber on ${url}`, err)
    throw new Error(`Error getCallForPhoneNumber on ${url} : ${JSON.stringify(err)}`)
  }
}

const getHistoryForCall = async (ovh, phoneNumber, callId) => {
  const url = `/telephony/${process.env.OVH_ACCOUNT_NUMBER}/conference/${phoneNumber}/histories/${callId}`

  try {
    return await ovh.requestPromised("GET", url, {})
  } catch (err) {
    console.error(`Error getHistoryForCall on ${url}`, err)
    throw new Error(`Error getHistoryForCall on ${url} : ${JSON.stringify(err)}`)
  }
}

const insertHistoryInDb = async(knex, phoneNumber, history) => {
  try {
    return await knex("callStats").insert({
      phoneNumber: phoneNumber,
      callId: history.id,
      dateBegin: history.dateBegin,
      dateEnd: history.dateEnd,
      countParticipants: history.countParticipants,
      countConnections: history.countConnections,
      durationMinutes: history.duration,
    })
  } catch (err) {
    console.error("insertHistoryInDb error", err)
  }
}

module.exports = async () => {
  console.debug("Start of fetchNumbersStats job")

  // Fetch env vars from config file
  dotenv.config({ path: ".env" })

  const ovh = ovhLib({
    appKey: process.env.OVH_APP_KEY,
    appSecret: process.env.OVH_APP_SECRET,
    consumerKey: process.env.OVH_CONSUMER_KEY,
  })

  // Todo use separate DB
  const knex = require("knex")({
    client: "pg",
    connection: process.env.DATABASE_URL,
    acquireConnectionTimeout: 10000,
  })

  // Drop old table
  try {
    await knex.schema.dropTable("callStats")
  } catch (err) {
    console.error("Could not drop old callStats table.", err)
  }

  try {
    await knex.schema
    .createTable("callStats", (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"))
      table.text("phoneNumber").notNullable()
      table.text("callId").notNullable()
      table.datetime("dateBegin").notNullable()
      table.datetime("dateEnd").notNullable()
      table.integer("durationMinutes").notNullable()
      table.integer("countParticipants").notNullable()
      table.integer("countConnections").notNullable()
    })
    console.debug("Created callStats table")
  } catch (err) {
    console.error("Could not create callStats table.", err)
  }

  let callsInsertedCounter = 0

  const phoneNumbers = await getAllPhoneNumbers(ovh)
  console.log("Got", phoneNumbers.length)

  for (const phoneNumber of phoneNumbers) {
    const callIds = await getCallsForPhoneNumber(ovh, phoneNumber)
    console.log("Got", callIds.length, "calls for", phoneNumber)

    for (const callId of callIds) {
      const history = await getHistoryForCall(ovh, phoneNumber, callId)
      console.log("Got history for", phoneNumber, callId, ", countParticipants", history.countParticipants)
      await insertHistoryInDb(knex, phoneNumber, history)
      callsInsertedCounter++
    }
    console.log("Inserted", callsInsertedCounter, "histories in db.")
  }

  console.log("Total : Inserted", callsInsertedCounter, "histories in db.")
  console.debug("End of fetchNumbersStats job.")
}
