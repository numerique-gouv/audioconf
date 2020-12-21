const chai = require('chai')
const crypto = require('crypto')
const db = require("../../lib/db")
const knex = require("../../knexfile")

const { checkAndThrowErrorIfNotInTestEnvironment, reinitializeDB, truncateAllTables } = require("../../lib/testUtils")

/* global describe before beforeEach it */
checkAndThrowErrorIfNotInTestEnvironment()

describe('Tests on db.js', function () {

  before(async () => {
    // Apply all migrations once and for all tests.
    await reinitializeDB(knex)
  })

  beforeEach(async () => {

    await truncateAllTables(knex)
  })

  describe('loginTokens table', function () {
    it('should return the same dateString for conferenceDay that was inserted', async function () {
      const conferenceDayString = '2020-12-04'
      const token = crypto.randomBytes(256).toString("base64")
      const tokenExpirationDate = new Date()
      tokenExpirationDate.setMinutes(tokenExpirationDate.getMinutes() + 60)

      await db.insertToken(
        'hello@blah.com',
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
  })
})
