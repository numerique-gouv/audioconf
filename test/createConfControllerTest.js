const chai = require("chai")
const sinon = require("sinon")
const jwt = require("jsonwebtoken")

const app = require("../index")
const conferences = require("../lib/conferences")
const db = require("../lib/db")
const emailer = require("../lib/emailer")
const magicLinkAuth = require("../lib/magicLinkAuth")
const oidcAuth = require("../lib/oidcAuth")
const urls = require("../urls")
const { encrypt } = require("../lib/crypto")
const config = require("../config")


describe("createConfController", function() {
  describe("createConf", function() {
    let createConfStub
    let sendEmailStub
    let insertConfStub
    let sendWebAccessEmailStub

    let oidcFlagBackupValue
    let webAccessFlagBackupValue

    beforeEach(function(done) {
      oidcFlagBackupValue = config.FEATURE_OIDC
      webAccessFlagBackupValue = config.FEATURE_WEB_ACCESS
      config.FEATURE_WEB_ACCESS = true

      createConfStub = sinon.stub(conferences, "createConf")
      sendEmailStub = sinon.stub(emailer, "sendConfCreatedEmail")
      sendWebAccessEmailStub = sinon.stub(emailer, "sendConfWebAccessEmail")
      insertConfStub = sinon.stub(db, "insertConferenceWithDay")

      done()
    })

    afterEach(function(done) {
      config.FEATURE_OIDC = oidcFlagBackupValue
      config.FEATURE_WEB_ACCESS = webAccessFlagBackupValue

      createConfStub.restore()
      sendEmailStub.restore()
      insertConfStub.restore()
      sendWebAccessEmailStub.restore()
      done()
    })

    describe("using magicLinkAuth", () => {
      let magicLinkFinishAuthStub

      beforeEach(function() {
        config.FEATURE_OIDC = false
        magicLinkFinishAuthStub = sinon.stub(magicLinkAuth, "finishAuth")
      })

      afterEach(function() {
        magicLinkFinishAuthStub.restore()
      })

      it("should create conf and send email", function(done) {
        shouldCreateConfAndSendEmail(done, magicLinkFinishAuthStub)
      })

      it("should redirect when finishAuth has failed", function(done) {
        shouldRedirectWhenFinishAuthHasFailed(done, magicLinkFinishAuthStub)
      })

      it("should redirect when conf was not created", function(done) {
        shouldRedirectWhenConfWasNotCreated(done, magicLinkFinishAuthStub)
      })

      it("should redirect when email was not sent", function(done) {
        shouldRedirectWhenEmailWasNotSent(done, magicLinkFinishAuthStub)
      })

    })


    describe("using OIDC auth", () => {
      let oidcFinishAuthStub

      beforeEach(function() {
        config.FEATURE_OIDC = true
        oidcFinishAuthStub = sinon.stub(oidcAuth, "finishAuth")
      })

      afterEach(function() {
        oidcFinishAuthStub.restore()
      })

      it("should create conf and send email", function(done) {
        shouldCreateConfAndSendEmail(done, oidcFinishAuthStub)
      })

      it("should redirect when finishAuth has failed", function(done) {
        shouldRedirectWhenFinishAuthHasFailed(done, oidcFinishAuthStub)
      })

      it("should redirect when conf was not created", function(done) {
        shouldRedirectWhenConfWasNotCreated(done, oidcFinishAuthStub)
      })

      it("should redirect when email was not sent", function(done) {
        shouldRedirectWhenEmailWasNotSent(done, oidcFinishAuthStub)
      })

    })

    const shouldCreateConfAndSendEmail = (done, finishAuthStub) => {
      const confUUID = "long_uuid"
      const confPin = 123456789
      const email = "good.email@thing.com"

      const successFinishAuthStub = finishAuthStub.returns(Promise.resolve(
        {
          email,
          durationInMinutes: undefined,
          conferenceDay: "2022-05-25",
          userTimezoneOffset: -60,
        }
      ))

      const successCreateConfStub = createConfStub.returns(Promise.resolve(
        { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
      const successInsertConfStub = insertConfStub.returns(Promise.resolve({
        id: confUUID,
        pin: confPin,
        phoneNumber: "+330122334455"
      }))
      const successSendEmailStub = sendEmailStub.returns(Promise.resolve())

      chai.request(app)
        .get(urls.createConf)
        .redirects(0) // block redirects, we don't want to test them
        .query({
          token: "long_random_token",
        })
        .end(function(err, res) {
          sinon.assert.calledOnce(successFinishAuthStub)
          sinon.assert.calledOnce(successCreateConfStub)
          sinon.assert.calledOnce(successInsertConfStub)
          chai.assert(successInsertConfStub.getCall(0).calledWith(email))
          sinon.assert.calledOnce(successSendEmailStub)
          sinon.assert.calledOnce(sendWebAccessEmailStub)
          res.should.redirectTo(urls.showConf.replace(":id", confUUID) + "#" + confPin)
          done()
        })
    }

    const shouldRedirectWhenFinishAuthHasFailed = (done, finishAuthStub) => {
      const confUUID = "long_uuid"
      const confPin = 123456789
      const successInsertConfStub = insertConfStub.returns(Promise.resolve({
        id: confUUID,
        pin: confPin,
      }))
      const successCreateConfStub = createConfStub.returns(Promise.resolve(
        { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
      const successSendEmailStub = sendEmailStub.returns(Promise.resolve())
      const failFinishAuthStub = finishAuthStub.returns(Promise.resolve(
        {
          error: "oooops",
        }
      ))

      chai.request(app)
        .get(urls.createConf)
        .redirects(0) // block redirects, we don't want to test them
        .query({
          token: "long_random_token",
        })
        .end(function(err, res) {
          sinon.assert.calledOnce(failFinishAuthStub)
          sinon.assert.notCalled(successCreateConfStub)
          sinon.assert.notCalled(successInsertConfStub)
          sinon.assert.notCalled(successSendEmailStub)
          res.should.redirectTo(urls.landing)
          done()
        })
    }

    const shouldRedirectWhenConfWasNotCreated = (done, finishAuthStub) => {
      const confUUID = "long_uuid"
      const confPin = 123456789
      const email = "good.email@thing.com"
      const successInsertConfStub = insertConfStub.returns(Promise.resolve({
        id: confUUID,
        pin: confPin,
      }))
      const successFinishAuthStub = finishAuthStub.returns(Promise.resolve({
        email,
        durationInMinutes: undefined,
        conferenceDay: "2022-05-25",
        userTimezoneOffset: -60,
      }))
      const successSendEmailStub = sendEmailStub.returns(Promise.resolve())
      // Conf creation errors
      const failCreateConfStub = createConfStub.returns(Promise.reject(new Error("Conf not created aaaaah")))

      chai.request(app)
        .get(urls.createConf)
        .redirects(0) // block redirects, we don't want to test them
        .query({
          token: "long_random_token",
        })
        .end(function(err, res) {
          sinon.assert.calledOnce(successFinishAuthStub)
          sinon.assert.calledOnce(failCreateConfStub)
          sinon.assert.notCalled(successInsertConfStub)
          sinon.assert.notCalled(successSendEmailStub)
          res.should.redirectTo(urls.landing)
          done()
        })
    }

    const shouldRedirectWhenEmailWasNotSent = (done, finishAuthStub) => {
      const confUUID = "long_uuid"
      const confPin = 123456789
      const email = "good.email@thing.com"

      const successFinishAuthStub = finishAuthStub.returns(Promise.resolve({
        email,
        durationInMinutes: undefined,
        conferenceDay: "2022-05-25",
        userTimezoneOffset: -60,
      }))
      const successCreateConfStub = createConfStub.returns(Promise.resolve(
        { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
      const successInsertConfStub = insertConfStub.returns(Promise.resolve({
        id: confUUID,
        pin: confPin,
      }))
      const failedSendEmailStub = sendEmailStub.returns(Promise.reject(new Error("oh no email not sent")))

      chai.request(app)
        .get(urls.createConf)
        .redirects(0) // block redirects, we don't want to test them
        .query({
          token: "long_random_token",
        })
        .end(function(err, res) {
          sinon.assert.calledOnce(successFinishAuthStub)
          sinon.assert.calledOnce(successCreateConfStub)
          sinon.assert.calledOnce(successInsertConfStub)
          sinon.assert.calledOnce(failedSendEmailStub)
          res.should.redirectTo(urls.landing)
          done()
        })
    }

  })



  describe("showConf", function() {
    let getConfStub

    beforeEach(function(done) {
      getConfStub = sinon.stub(db, "getUnexpiredConference")
      done()
    })

    afterEach(function(done) {
      getConfStub.restore()
      done()
    })

    it("should display the date for the conference", function(done) {
      const confUUID = "long_uuid"
      const confPin = 123456789
      getConfStub = getConfStub.returns(Promise.resolve(
        {
          id: confUUID,
          phoneNumber: "0033122334455",
          conferenceDay: "2020-01-26",
          // Conference expires at midnight for user's local time, which is 4am the next day in GMT.
          expiresAt: new Date("2021-01-27 03:59:59+00")
         }))

      chai.request(app)
        .get(urls.showConf.replace(":id", confUUID) + "#" + confPin)
        .end(function(err, res) {
          chai.assert.include(res.text, "26 janvier")
          chai.assert.notInclude(res.text, "27 janvier")
          done()
        })
    })
  })

  describe("should access dashboard", function() {
    let fetchDashboardInfo
    let getParticipant
    let clock

    beforeEach(function(done) {
      fetchDashboardInfo = sinon.stub(conferences, "fetchDashboardInfo").returns(Promise.resolve(
        [
          44545
        ]))
      getParticipant = sinon.stub(conferences, "getParticipant").returns(Promise.resolve(
        {
          arrivalDateTime: new Date(),
          callerNumber: "+3306STEHDTSXTH",
          talking: true,
          speak: true,
          floor: true,
          hear: true,
          id: 44545
        }))
      clock = sinon.useFakeTimers(new Date("2020-01-01T09:59:59+01:00"))
      done()
    })

    afterEach(function(done) {
      fetchDashboardInfo.restore()
      getParticipant.restore()
      clock.restore()
      done()
    })

    it("should not be able to fetchDashboardInfo with bad roomNumberHash", function(done) {
      const roomNumber = 123456789
      const roomNumberHash = encrypt(jwt.sign({ roomNumber: roomNumber } , "abadsecret", { expiresIn: "15d" }))
      chai.request(app)
        .post("/dashboard/fetch-dashboard-info")
        .type("form")
        .send({
          roomNumberHash
        })
        .redirects(0) // block redirects, we don't want to test them
        .end(function(err, res) {
          sinon.assert.notCalled(fetchDashboardInfo)
          sinon.assert.notCalled(getParticipant)
          done()
        })
    })

    it("should not be able to get participants info if jwt is expired", function(done) {
      const roomNumber = 123456789
      const roomNumberHash = encrypt(jwt.sign({ roomNumber: roomNumber } , config.SECRET, { expiresIn: "1m" }))
      clock.tick((60*1000) + 1)
      chai.request(app)
        .post(`/dashboard/fetch-dashboard-info`)
        .type("form")
        .send({
          roomNumberHash
        })
        .redirects(0) // block redirects, we don't want to test them
        .end(function(err, res) {
          sinon.assert.notCalled(fetchDashboardInfo)
          sinon.assert.notCalled(getParticipant)
          done()
        })
    })

    it("should be able to get participants info if jwt ok", function(done) {
      const roomNumber = 123456789
      const roomNumberHash = encrypt(jwt.sign({ roomNumber: roomNumber } , config.SECRET, { expiresIn: "15d" }))
      chai.request(app)
        .post(`/dashboard/fetch-dashboard-info`)
        .type("form")
        .send({
          roomNumberHash
        })
        .end(function(err, res) {
          sinon.assert.called(fetchDashboardInfo)
          sinon.assert.called(getParticipant)
          done()
        })
    })
  })
})
