const chai = require("chai")
const config = require("../config")
const crypto = require("crypto")
const db = require("../lib/db")
const anonymizeJob = require("../jobs/anonymizeConferences")

/* global describe beforeAll afterAll it */

const knex = require("knex")({
  client: "pg",
  connection: config.DATABASE_URL,
  acquireConnectionTimeout: 10000,
})

const conferences = [
  {
    "id": "53358df7-96c2-40b8-8c1b-7f7c03605538",
    "email": "jean-marc.dupont@beta.gouv.fr",
    "expiresAt": "2020-12-14 22:59:59.000000",
  },
  {
    "id": "649af661-7f3f-4e78-bce1-faf19b6722c4",
    "email": "jean-marc.dupont@beta.gouv.fr",
    "expiresAt": "2020-12-13 22:59:59.000000",
  },
  {
    "id": "d4bc5446-4e50-43dd-a1ba-cb43681e6b70",
    "email": "olivier.martin@dgfip.finances.gouv.fr",
    "expiresAt": new Date().toISOString(),
  }
]

describe("db", function () {
  console.log("DATABASE_URL", config.DATABASE_URL)

  beforeAll(async function () {
    // Apply all migrations.
    await knex.migrate.latest({})
  })

  afterAll(async function () {
    // Rollback all migrations.
    await knex.migrate.rollback({}, true)
  })

  describe("loginTokens table", function () {
    it("should return the same dateString for conferenceDay that was inserted", async function () {
      const conferenceDayString = "2020-12-04"
      const token = crypto.randomBytes(256).toString("base64")
      const tokenExpirationDate = new Date()
      tokenExpirationDate.setMinutes(tokenExpirationDate.getMinutes() + 60)

      await db.insertToken(
        "hello@blah.com",
        token,
        tokenExpirationDate,
        undefined, // conferenceDurationInMinutes
        conferenceDayString,
      )
      const fetchedTokens = await db.getToken(token)

      chai.assert.equal(fetchedTokens.length, 1)
      chai.assert.equal(fetchedTokens[0].conferenceDay, conferenceDayString)
      return Promise.resolve() // needed for async test
    })

    it("should", async function() {
      conferences.forEach(async (conference) => {
        await knex.insert(conference)
      })

      const updatedConferences = await anonymizeJob()

      chai.assert.equal(updatedConferences, [])

    })
  })
})
