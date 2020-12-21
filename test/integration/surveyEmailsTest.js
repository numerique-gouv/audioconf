const chai = require("chai")
const sinon = require("sinon")
var subDays = require("date-fns/subDays")
var subHours = require("date-fns/subHours")

const knex = require("../../knexfile")
const emailer = require("../../lib/emailer")
const surveyEmailsJob = require("../../jobs/sendSurveyEmails")

const { checkAndThrowErrorIfNotInTestEnvironment, insertConferences, insertUsers, reinitializeDB, truncateAllTables } = require("../../lib/testUtils")

/* global afterEach describe before beforeEach it */
checkAndThrowErrorIfNotInTestEnvironment()

const now = new Date()
const yesterday = subHours(now, 20)
const beforeYesterday = subDays(now, 2)
const lastWeek = subDays(now, 5)
const beforeLastWeek = subDays(now, 10)

describe("Tests on send survey email job", () => {
  let sendEmailStub

  before(async () => {
    // Apply all migrations once and for all tests.
    await reinitializeDB(knex)
  })

  beforeEach(async () => {
    sendEmailStub = sinon.stub(emailer, "sendSurveyEmail").returns(Promise.resolve("Email sent"))
    await truncateAllTables(knex)
  })

  afterEach(async () => {
    await sendEmailStub.restore()
  })

  it("should send email to Jean-Marc Dupont", async function () {

    const conferences = [
      {
        "id": "53358df7-96c2-40b8-8c1b-7f7c03605538",
        "email": "jean-marc.dupont@gouv.fr",
        "expiresAt": yesterday.toISOString(),
        "hashedEmail": "hashedEmailForjean-marc.dupont@gouv.fr",
        "phoneNumber": "",
      },
    ]

    await insertConferences(conferences, knex)

    const emails = await surveyEmailsJob()

    chai.assert.equal(emails.length, 1)
    chai.assert.equal(emails[0].email, "jean-marc.dupont@gouv.fr")
    sinon.assert.calledOnce(sendEmailStub)

  })

  it("shouldn't send email to Jean-Marc Dupont cause the expiration date is too old", async function () {

    const conferences = [
      {
        "id": "53358df7-96c2-40b8-8c1b-7f7c03605538",
        "email": "jean-marc.dupont@gouv.fr",
        "expiresAt": beforeYesterday.toISOString(),
        "hashedEmail": "hashedEmailForjean-marc.dupont@gouv.fr",
        "phoneNumber": "",
      },
    ]

    await insertConferences(conferences, knex)

    const emails = await surveyEmailsJob()

    chai.assert.equal(emails.length, 0)

    sinon.assert.notCalled(sendEmailStub)

  })

  it("shouldn't send email to Jean-Marc Dupont cause we send email the last week", async function () {

    const conferences = [
      {
        "id": "53358df7-96c2-40b8-8c1b-7f7c03605538",
        "email": "jean-marc.dupont@gouv.fr",
        "expiresAt": yesterday.toISOString(),
        "hashedEmail": "hashedEmailForjean-marc.dupont@gouv.fr",
        "phoneNumber": "",
      },
    ]

    const users = [
      {
        "id": "53358df7-96c2-40b8-8c1b-7f7c03605538",
        "surveySentAt": lastWeek.toISOString(),
        "hashedEmail": "hashedEmailForjean-marc.dupont@gouv.fr"
      }
    ]

    await insertConferences(conferences, knex)
    await insertUsers(users, knex)

    const emails = await surveyEmailsJob()

    chai.assert.equal(emails.length, 0)
    sinon.assert.notCalled(sendEmailStub)

  })

  it("should send email to Jean-Marc Dupont cause we send email but it was before last week", async function () {

    const conferences = [
      {
        "id": "53358df7-96c2-40b8-8c1b-7f7c03605538",
        "email": "jean-marc.dupont@gouv.fr",
        "expiresAt": yesterday.toISOString(),
        "hashedEmail": "hashedEmailForjean-marc.dupont@gouv.fr",
        "phoneNumber": "",
      },
    ]

    const users = [
      {
        "id": "53358df7-96c2-40b8-8c1b-7f7c03605538",
        "surveySentAt": beforeLastWeek.toISOString(),
        "hashedEmail": "hashedEmailForjean-marc.dupont@gouv.fr"
      }
    ]

    await insertConferences(conferences, knex)
    await insertUsers(users, knex)

    const emails = await surveyEmailsJob()

    chai.assert.equal(emails.length, 1)
    chai.assert.equal(emails[0].email, "jean-marc.dupont@gouv.fr")
    sinon.assert.calledOnce(sendEmailStub)

  })

})
