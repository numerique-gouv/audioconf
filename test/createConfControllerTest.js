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
const { finished } = require("nodemailer/lib/xoauth2")


describe("createConfController", function() {
  describe("createConf", function() {
    let createConfStub
    let sendEmailStub
    let insertConfStub
    let sendWebAccessEmailStub

    let featureFlagValue

    beforeEach(function(done) {
      featureFlagValue = config.FEATURE_OIDC

      createConfStub = sinon.stub(conferences, "createConf")
      sendEmailStub = sinon.stub(emailer, "sendConfCreatedEmail")
      sendWebAccessEmailStub = sinon.stub(emailer, "sendConfWebAccessEmail")
      insertConfStub = sinon.stub(db, "insertConferenceWithDay")

      done()
    })

    afterEach(function(done) {
      config.FEATURE_OIDC = featureFlagValue

      createConfStub.restore()
      sendEmailStub.restore()
      insertConfStub.restore()
      sendWebAccessEmailStub.restore()
      done()
    })

    describe("using magicLinkAuth", () => {
      let finishAuthStub

      beforeEach(function() {
        config.FEATURE_OIDC = false
        finishAuthStub = sinon.stub(magicLinkAuth, "finishAuth")
      })

      afterEach(function() {
        finishAuthStub.restore()
      })

      it("should create conf and send email", function(done) {
        const confUUID = "long_uuid"
        const confPin = 123456789
        const email = "good.email@thing.com"

        finishAuthStub.returns(Promise.resolve(
          {
            email,
            durationInMinutes: undefined,
            conferenceDay: "2022-05-25",
            userTimezoneOffset: -60,
          }
        ))

        createConfStub = createConfStub.returns(Promise.resolve(
          { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
        insertConfStub = insertConfStub.returns(Promise.resolve({
          id: confUUID,
          pin: confPin,
          phoneNumber: "+330122334455"
        }))
        sendEmailStub = sendEmailStub.returns(Promise.resolve())

        chai.request(app)
          .get(urls.createConf)
          .redirects(0) // block redirects, we don't want to test them
          .query({
            token: "long_random_token",
          })
          .end(function(err, res) {
            sinon.assert.calledOnce(finishAuthStub)
            sinon.assert.calledOnce(createConfStub)
            sinon.assert.calledOnce(insertConfStub)
            chai.assert(insertConfStub.getCall(0).calledWith(email))
            sinon.assert.calledOnce(sendEmailStub)
            sinon.assert.calledOnce(sendWebAccessEmailStub)
            res.should.redirectTo(urls.showConf.replace(":id", confUUID) + "#" + confPin)
            done()
          })
      })

      it("should redirect when finishAuth has failed", function(done) {
        const confUUID = "long_uuid"
        const confPin = 123456789
        insertConfStub = insertConfStub.returns(Promise.resolve({
          id: confUUID,
          pin: confPin,
        }))
        createConfStub = createConfStub.returns(Promise.resolve(
          { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
        sendEmailStub = sendEmailStub.returns(Promise.resolve())
        finishAuthStub.returns(Promise.resolve(
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
            sinon.assert.calledOnce(finishAuthStub)
            sinon.assert.notCalled(createConfStub)
            sinon.assert.notCalled(insertConfStub)
            sinon.assert.notCalled(sendEmailStub)
            res.should.redirectTo(urls.landing)
            done()
          })
      })

      it("should redirect when conf was not created", function(done) {
        const confUUID = "long_uuid"
        const confPin = 123456789
        const email = "good.email@thing.com"
        insertConfStub = insertConfStub.returns(Promise.resolve({
          id: confUUID,
          pin: confPin,
        }))
        finishAuthStub.returns(Promise.resolve({
          email,
          durationInMinutes: undefined,
          conferenceDay: "2022-05-25",
          userTimezoneOffset: -60,
        }))
        sendEmailStub = sendEmailStub.returns(Promise.resolve())
        // Conf creation errors
        createConfStub = createConfStub.returns(Promise.reject(new Error("Conf not created aaaaah")))

        chai.request(app)
          .get(urls.createConf)
          .redirects(0) // block redirects, we don't want to test them
          .query({
            token: "long_random_token",
          })
          .end(function(err, res) {
            sinon.assert.calledOnce(finishAuthStub)
            sinon.assert.calledOnce(createConfStub)
            sinon.assert.notCalled(insertConfStub)
            sinon.assert.notCalled(sendEmailStub)
            res.should.redirectTo(urls.landing)
            done()
          })
      })

      it("should redirect when email was not sent", function(done) {
        const confUUID = "long_uuid"
        const confPin = 123456789
        const email = "good.email@thing.com"
        finishAuthStub.returns(Promise.resolve({
          email,
          durationInMinutes: undefined,
          conferenceDay: "2022-05-25",
          userTimezoneOffset: -60,
        }))
        createConfStub = createConfStub.returns(Promise.resolve(
          { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
        insertConfStub = insertConfStub.returns(Promise.resolve({
          id: confUUID,
          pin: confPin,
        }))
        sendEmailStub = sendEmailStub.returns(Promise.reject(new Error("oh no email not sent")))

        chai.request(app)
          .get(urls.createConf)
          .redirects(0) // block redirects, we don't want to test them
          .query({
            token: "long_random_token",
          })
          .end(function(err, res) {
            sinon.assert.calledOnce(finishAuthStub)
            sinon.assert.calledOnce(createConfStub)
            sinon.assert.calledOnce(insertConfStub)
            sinon.assert.calledOnce(sendEmailStub)
            res.should.redirectTo(urls.landing)
            done()
          })
      })

    })


    describe("using OIDC auth", () => {
      let getOidcRequestStub
      let oidcClientStub

      beforeEach(function() {
        config.FEATURE_OIDC = true

        getOidcRequestStub = sinon.stub(db, "getOidcRequest")
        oidcClientStub = sinon.stub(oidcAuth, "getClient")
        oidcClientStub.returns(Promise.resolve({
          callback: () => ({
            access_token: "myAccessToken",
            expires_at: 1653316281,
            refresh_expires_in: 60,
            refresh_token: "myRefreshToken",
            token_type: "Bearer",
            id_token: "myIdToken",
            "not-before-polic": 0,
            session_state: "mySessionState",
            scope: "openid profile email"
          }),
          callbackParams: () => ({ state: "myState"}),
          authorizationUrl: () => "myRedirectUrl",
          userinfo: () => ({
            sub: "mySub",
            email_verified: false,
            preferred_username: "good.email@thing.com"
          })
        }))

//        finishAuthStub = sinon.stub(magicLinkAuth, "finishAuth")
      })

      afterEach(function() {
  //      finishAuthStub.restore()
        getOidcRequestStub.restore()
        oidcClientStub.restore()
      })

      it("should create conf and send email", function(done) {
        const confUUID = "long_uuid"
        const confPin = 123456789
        const email = "good.email@thing.com"
        getOidcRequestStub = getOidcRequestStub.returns(Promise.resolve([{
          state: "myState",
          createdAt: "2022-05-23T14:26:06.717Z",
          email,
          conferenceDay: "2020-12-09",
          userTimezoneOffset: "-180",
        }]))

        createConfStub = createConfStub.returns(Promise.resolve(
          { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
        insertConfStub = insertConfStub.returns(Promise.resolve({
          id: confUUID,
          pin: confPin,
          phoneNumber: "+330122334455"
        }))
        sendEmailStub = sendEmailStub.returns(Promise.resolve())

        chai.request(app)
          .get(urls.createConf)
          .redirects(0) // block redirects, we don't want to test them
          .query({
            token: "long_random_token",
          })
          .end(function(err, res) {
            sinon.assert.calledOnce(getOidcRequestStub)
            sinon.assert.calledOnce(createConfStub)
            sinon.assert.calledOnce(insertConfStub)
            chai.assert(insertConfStub.getCall(0).calledWith(email))
            sinon.assert.calledOnce(sendEmailStub)
            sinon.assert.calledOnce(sendWebAccessEmailStub)
            res.should.redirectTo(urls.showConf.replace(":id", confUUID) + "#" + confPin)
            done()
          })
      })

      it("should redirect when request is bad", function(done) {
        const confUUID = "long_uuid"
        const confPin = 123456789
        insertConfStub = insertConfStub.returns(Promise.resolve({
          id: confUUID,
          pin: confPin,
        }))
        createConfStub = createConfStub.returns(Promise.resolve(
          { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
        sendEmailStub = sendEmailStub.returns(Promise.resolve())
        // No oidc request found.
        getOidcRequestStub = getOidcRequestStub.returns(Promise.resolve([]))

        chai.request(app)
          .get(urls.createConf)
          .redirects(0) // block redirects, we don't want to test them
          .query({
            token: "long_random_token",
          })
          .end(function(err, res) {
            sinon.assert.calledOnce(getOidcRequestStub)
            sinon.assert.notCalled(createConfStub)
            sinon.assert.notCalled(insertConfStub)
            sinon.assert.notCalled(sendEmailStub)
            res.should.redirectTo(urls.landing)
            done()
          })
      })

      it("should redirect when conf was not created", function(done) {
        const confUUID = "long_uuid"
        const confPin = 123456789
        const email = "good.email@thing.com"

        insertConfStub = insertConfStub.returns(Promise.resolve({
          id: confUUID,
          pin: confPin,
        }))
        getOidcRequestStub = getOidcRequestStub.returns(Promise.resolve([{
          state: "myState",
          createdAt: "2022-05-23T14:26:06.717Z",
          email,
          conferenceDay: "2020-12-09",
          userTimezoneOffset: "-180",
        }]))
        sendEmailStub = sendEmailStub.returns(Promise.resolve())
        // Conf creation errors
        createConfStub = createConfStub.returns(Promise.reject(new Error("Conf not created aaaaah")))

        chai.request(app)
          .get(urls.createConf)
          .redirects(0) // block redirects, we don't want to test them
          .query({
            token: "long_random_token",
          })
          .end(function(err, res) {
            sinon.assert.calledOnce(getOidcRequestStub)
            sinon.assert.calledOnce(createConfStub)
            sinon.assert.notCalled(insertConfStub)
            sinon.assert.notCalled(sendEmailStub)
            res.should.redirectTo(urls.landing)
            done()
          })
      })

      it("should redirect when email was not sent", function(done) {
        const confUUID = "long_uuid"
        const confPin = 123456789
        const email = "good.email@thing.com"

        getOidcRequestStub = getOidcRequestStub.returns(Promise.resolve([{
          state: "myState",
          createdAt: "2022-05-23T14:26:06.717Z",
          email,
          conferenceDay: "2020-12-09",
          userTimezoneOffset: "-180",
        }]))
        createConfStub = createConfStub.returns(Promise.resolve(
          { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
        insertConfStub = insertConfStub.returns(Promise.resolve({
          id: confUUID,
          pin: confPin,
        }))
        sendEmailStub = sendEmailStub.returns(Promise.reject(new Error("oh no email not sent")))

        chai.request(app)
          .get(urls.createConf)
          .redirects(0) // block redirects, we don't want to test them
          .query({
            token: "long_random_token",
          })
          .end(function(err, res) {
            sinon.assert.calledOnce(getOidcRequestStub)
            sinon.assert.calledOnce(createConfStub)
            sinon.assert.calledOnce(insertConfStub)
            sinon.assert.calledOnce(sendEmailStub)
            res.should.redirectTo(urls.landing)
            done()
          })
      })

    })
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
