const chai = require("chai")
const sinon = require("sinon")

const app = require("../index")
const conferences = require("../lib/conferences")
const db = require("../lib/db")
const emailer = require("../lib/emailer")
const urls = require("../urls")

describe("createConfController", function() {
  describe("createConf", function() {
    let createConfStub
    let sendEmailStub
    let getTokenStub
    let insertConfStub

    beforeEach(function(done) {
      createConfStub = sinon.stub(conferences, "createConf")
      sendEmailStub = sinon.stub(emailer, "sendConfCreatedEmail")
      getTokenStub = sinon.stub(db, "getToken")
      insertConfStub = sinon.stub(db, "insertConferenceWithDay")

      done()
    })

    afterEach(function(done) {
      createConfStub.restore()
      sendEmailStub.restore()
      getTokenStub.restore()
      insertConfStub.restore()
      done()
    })

    it("should create conf and send email", function(done) {
      const confUUID = "long_uuid"
      const confPin = 123456789
      const email = "good.email@thing.com"
      getTokenStub = getTokenStub.returns(Promise.resolve([{
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
      sendEmailStub = sendEmailStub.returns(Promise.resolve())

      chai.request(app)
        .get(urls.createConf)
        .redirects(0) // block redirects, we don't want to test them
        .query({
          token: "long_random_token",
        })
        .end(function(err, res) {
          sinon.assert.calledOnce(getTokenStub)
          sinon.assert.calledOnce(createConfStub)
          sinon.assert.calledOnce(insertConfStub)
          chai.assert(insertConfStub.getCall(0).calledWith(email))
          sinon.assert.calledOnce(sendEmailStub)
          res.should.redirectTo(urls.showConf.replace(":id", confUUID) + "#" + confPin)
          done()
        })
    })

    it("should redirect when token is bad", function(done) {
      const confUUID = "long_uuid"
      const confPin = 123456789
      insertConfStub = insertConfStub.returns(Promise.resolve({
        id: confUUID,
        pin: confPin,
      }))
      createConfStub = createConfStub.returns(Promise.resolve(
        { phoneNumber: "+330122334455", pin: confPin, freeAt: new Date() }))
      sendEmailStub = sendEmailStub.returns(Promise.resolve())
      // No token found.
      getTokenStub = getTokenStub.returns(Promise.resolve([]))

      chai.request(app)
        .get(urls.createConf)
        .redirects(0) // block redirects, we don't want to test them
        .query({
          token: "long_random_token",
        })
        .end(function(err, res) {
          sinon.assert.calledOnce(getTokenStub)
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
      insertConfStub = insertConfStub.returns(Promise.resolve({
        id: confUUID,
        pin: confPin,
      }))
      getTokenStub = getTokenStub.returns(Promise.resolve([{
        email: "good.email@thing.com",
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
          sinon.assert.calledOnce(getTokenStub)
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
      getTokenStub = getTokenStub.returns(Promise.resolve([{
        email: "good.email@thing.com",
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
          sinon.assert.calledOnce(getTokenStub)
          sinon.assert.calledOnce(createConfStub)
          sinon.assert.calledOnce(insertConfStub)
          sinon.assert.calledOnce(sendEmailStub)
          res.should.redirectTo(urls.landing)
          done()
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
})
