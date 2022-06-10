const { expect } = require("chai")

const config = require("../config")
const db = require("../lib/db")
const emailer = require("../lib/emailer")
const sinon = require("sinon")
const url = require("url")
const utils = require("./utils")

const magicLinkAuth = require("../lib/magicLinkAuth")

describe("magicLinkAuth", function() {
  let sendEmailStub
  let dbStub
  let EMAIL_WHITELIST_BCK

  beforeEach(function(done) {
    EMAIL_WHITELIST_BCK = config.EMAIL_WHITELIST
    config.EMAIL_WHITELIST = [ /.*@(.*\.|)beta\.gouv\.fr/, /.*@(.*\.|)numerique\.gouv\.fr/ ]
    done()
  })

  afterEach(function(done) {
    config.EMAIL_WHITELIST = EMAIL_WHITELIST_BCK
    done()
  })

  describe("unit tests", () => {
    beforeEach(function(done) {
      sendEmailStub = sinon.stub(emailer, "sendEmailValidationEmail")
      dbStub = sinon.stub(db, "insertToken")
      done()
    })

    afterEach(function(done) {
      sendEmailStub.restore()
      dbStub.restore()
      done()
    })

    it("should refuse invalid email", async function() {
      const email = "bad.email"
      const request = await magicLinkAuth.startAuth(email)

      expect(request).to.have.own.property("error")
      sinon.assert.notCalled(sendEmailStub)
      sinon.assert.notCalled(dbStub)
    })

    it("should refuse email that is not in EMAIL_WHITELIST", async function() {
      const email = "bad.email@not.betagouv.fr"
      const request = await magicLinkAuth.startAuth(email)

      expect(request).to.have.own.property("error")
      expect(request).not.to.have.own.property("redirectUrl")
      sinon.assert.notCalled(sendEmailStub)
      sinon.assert.notCalled(dbStub)
    })

    it("should send email and record the auth token in db", async function() {
      const email = "good.email@beta.gouv.fr"
      const conferenceDayString = "2022-05-25"
      const userTimezoneOffset = 120
      sendEmailStub.returns(Promise.resolve())
      dbStub.returns(Promise.resolve())

      const request = await magicLinkAuth.startAuth(
        email,
        undefined, //conferenceDurationInMinutes,
        conferenceDayString,
        userTimezoneOffset,
      )

      expect(request).to.have.own.property("redirectUrl")
      expect(request).not.to.have.own.property("error")
      expect(request.redirectUrl).to.contain(email.replace("@", "%40"))
      sinon.assert.calledOnce(sendEmailStub)
      sinon.assert.calledWith(sendEmailStub.getCall(0),
        email
      )
      sinon.assert.calledOnce(dbStub)
      sinon.assert.calledWith(dbStub.getCall(0),
        email,
        sinon.match.string, // token,
        sinon.match.date, // tokenExpirationDate,
        undefined, // conferenceDurationInMinutes,
        conferenceDayString,
        userTimezoneOffset
      )

      // check token is present in email
      const magicLink = sendEmailStub.getCall(0).args[2]
      const token = dbStub.getCall(0).args[1]
      expect(magicLink).to.contain(encodeURIComponent(token))
    })
  })

  describe("end to end test", () => {
    beforeEach(async function() {
      sendEmailStub = sinon.stub(emailer, "sendEmailValidationEmail")
      // don't stub DB, use real one
      await utils.reinitializeDB()
    })

    afterEach(function(done) {
      sendEmailStub.restore()
      done()
    })

    after(async () => {
      await utils.reinitializeDB()
    })

    it("should run the whole auth flow", async () => {
      const email = "good.email@beta.gouv.fr"
      const conferenceDayString = "2022-05-25"
      const userTimezoneOffset = 120
      sendEmailStub.returns(Promise.resolve())

      await magicLinkAuth.startAuth(
        email,
        undefined, //conferenceDurationInMinutes,
        conferenceDayString,
        userTimezoneOffset,
      )

      // The magicLink that was emailed :
      const magicLink = sendEmailStub.getCall(0).args[2]

      // Simulate : The user clicks the magic link
      const fakeRequest = url.parse(magicLink, true)
      const confData = await magicLinkAuth.finishAuth(fakeRequest)
      console.log("confData", confData)

      expect(confData.email).to.equal(email)
      expect(confData.conferenceDay).to.equal(conferenceDayString)
      expect(confData.userTimezoneOffset).to.equal(userTimezoneOffset)
    })
  })
})
