const config = require("../config")
const format = require("../lib/format")

const knex = require("knex")({
    client: "pg",
    connection: config.DATABASE_URL,
    acquireConnectionTimeout: 10000,
  })


module.exports.knex = knex

/*
Returns true if DB is contacted successfully within 10 secs and has at least 1 migration. Else false.
*/
module.exports.getDBStatus = async () => {
    try {
        const lastMigration = await knex("knex_migrations").select()
            .orderBy("id", "desc")
            .limit(1)
            .timeout(10 * 1000, {cancel: true})
        if (lastMigration.length === 0) {
            console.error("error with DB : no migrations")
            return false
        }
        return true
    } catch(err) {
        console.error("status check got error with DB", err)
        return false
    }
}

module.exports.insertConference = async (email, phoneNumber, durationInMinutes, expiresAt) => {
    try {
        return (await knex("conferences").insert({
          email,
          phoneNumber,
          durationInMinutes,
          expiresAt,
        }).returning("*"))[0]
    } catch (err) {
        console.error("Erreur de sauvegarde de la conférence", err)
        throw new Error("Erreur de sauvegarde de la conférence")
    }
}

module.exports.insertConferenceWithFreeAt = async (email, phoneNumber, expiresAt) => {
    try {
        return (await knex("conferences").insert({
          email,
          phoneNumber,
          expiresAt,
        }).returning("*"))[0]
    } catch (err) {
        console.error("Erreur de sauvegarde de la conférence", err)
        throw new Error("Erreur de sauvegarde de la conférence")
    }
}

module.exports.getUnexpiredConference = async (id) => {
    try {
        const conferences = await knex("conferences").select()
            .where({ id: id })
            .andWhere("expiresAt", ">", new Date())
        return conferences[0]
    } catch (err) {
      console.error("getUnexpiredConference: Impossible de récupérer la conférence %s", id, err)
      throw new Error("getUnexpiredConference: Impossible de récupérer la conférence")
    }
}

// Note : this works for both Rooms and Numbers APIs.
module.exports.cancelConference = async (id) => {
    try {
        const conference = module.exports.getUnexpiredConference(id)
        if(!conference) {
            console.error("cancelConference: Impossible de récupérer la conférence %s", id)
            throw new Error("cancelConference: Impossible de récupérer la conférence")
        }
        await knex("conferences")
            .where({ id: id })
            .update({ canceledAt: knex.fn.now() })

        return conference
    } catch (err) {
        console.error(`Impossible d'annuler la conférence ${id}`, err)
        throw new Error("Impossible d'annuler la conférence")
    }
}

// conferenceDayString format : YYY-MM-DD
module.exports.insertToken = async (
        email,
        token,
        tokenExpirationDate,
        conferenceDurationInMinutes,
        conferenceDayString,
        userTimezoneOffset = -60, // default : Paris winter time
    ) => {
    try {
      return await knex("loginTokens").insert({
        token,
        email,
        durationInMinutes: conferenceDurationInMinutes,
        expiresAt: tokenExpirationDate,
        conferenceDay: conferenceDayString,
        userTimezoneOffset,
      })
    } catch (err) {
      console.error("Erreur de sauvegarde du token", err)
      throw new Error("Erreur de sauvegarde du token")
    }
}

module.exports.getToken = async (token) => {
    try {
        const tokens = await knex("loginTokens").select()
            .where({ token: token })
            .andWhere("expiresAt", ">", new Date())
            .del()
            .returning("*")
        // Format the conferenceDays to be YYYY-MM-DD strings, rather than full Date objects
        // (the field is a table.date in knex, not a table.datetime, so it's less confusing to use a dateString.)
        tokens.forEach(token => {
            if (token.conferenceDay) {
                const dayString = format.formatStandardDate(token.conferenceDay)
                token.conferenceDay = dayString
            }
       })
       return tokens
    } catch (err) {
      console.error("Impossible de récupérer le token", err)
      throw new Error("Impossible de récupérer le token")
    }
}

module.exports.insertStatsPoint = async (stats) => {
    try {
      return await knex("stats").insert({
        date : new Date(),
        onlineParticipantsCount : stats.onlineParticipantsCount,
        activeConfsCount : stats.activeConfsCount,
        bookedRoomsCount: stats.bookedRoomsCount,
      })
    } catch (err) {
      console.error("Erreur de sauvegarde du statsPoint", err)
      throw new Error("Erreur de sauvegarde du statsPoint")
    }
}

module.exports.getLatestStatsPoints = async (numPoints) => {
    try {
        const statsPointArray = await knex("stats").select()
           .orderBy("date", "desc")
           .limit(numPoints)
        if (statsPointArray.length === 0) {
            // If no stats yet, return empty stats object, to avoid breaking things.
            return [{
                date: new Date(),
                onlineParticipantsCount: 0,
                activeConfsCount: 0,
                errorConfsCount: 0,
            }]
        }
        return statsPointArray
    } catch (err) {
      console.error(`Impossible de récupérer les ${numPoints} statsPoints`, err)
      throw new Error(`Impossible de récupérer les ${numPoints} statsPoints`)
    }
}

function parseEmail(email = "") {
  const [name = "", domain = ""] = email.split("@")

  return { name, domain }
}

module.exports.anonymizeConferences = async () => {
  try {
    const conferencesToUpdate = await knex("conferences")
      .select("id", "email")
      .whereNotNull("email")
      .whereRaw(`"expiresAt" < now() - interval '2 days'`)

    if (!conferencesToUpdate.length) {
      console.debug("Number of anonymized conferences : 0")
      return 0
    }

    const updateQueries = conferencesToUpdate.map(({ id, email }) =>
      knex("conferences")
        .where("id", id)
        .update({ email: null, domain: parseEmail(email).domain })
    )

    const nbQueries = await Promise.all(updateQueries)

    console.debug("Number of anonymized conferences :", nbQueries.length)

    return nbQueries.length
  } catch (err) {
    console.error("Error during conferences anonymization", err)
    throw new Error("Error during conferences anonymization")
  }
}
