const chai = require('chai')
const sinon = require('sinon')

const app = require('../index')
const conferences = require('../lib/conferences')
const config = require('../config')
const db = require('../lib/db')
const emailer = require('../lib/emailer')
const urls = require('../urls')

describe('createConfController', function() {
  let createConfStub
  let sendEmailStub
  let getTokenStub
  let insertConfStub
  let USE_OVH_ROOM_API_BCK

  beforeEach(function(done) {
    createConfStub = sinon.stub(conferences, 'createConf')
    sendEmailStub = sinon.stub(emailer, 'sendConfCreatedEmail')
    getTokenStub = sinon.stub(db, 'getToken')
    insertConfStub = sinon.stub(db, 'insertConferenceWithFreeAt')

    USE_OVH_ROOM_API_BCK = config.USE_OVH_ROOM_API
    config.USE_OVH_ROOM_API = true
    done()
  })

  afterEach(function(done) {
    createConfStub.restore()
    sendEmailStub.restore()
    getTokenStub.restore()
    insertConfStub.restore()
    config.USE_OVH_ROOM_API = USE_OVH_ROOM_API_BCK
    done()
  })

  const setupStubsForSuccessCase = (conference) => {
    // Todo : use typescript to return a Token DB object
    getTokenStub = getTokenStub.returns(Promise.resolve([{
      token: 'long_random_token',
      email: conference.email,
      conferenceDay: conference.conferenceDay,
      userTimezoneOffset: conference.userTimezoneOffset,
      createdAt: new Date(),
      expiresAt: new Date(),
    }]))

    // Assumes Rooms API
    createConfStub = createConfStub.returns(Promise.resolve({
      phoneNumber: conference.phoneNumber,
      pin: conference.pin,
      freeAt: conference.freeAt
    }))

    // Todo : use typescript to return a Conference DB object
    insertConfStub = insertConfStub.returns(Promise.resolve({
      id: conference.id,
      email: conference.email,
      phoneNumber: conference.phoneNumber,
      createdAt: new Date(),
      expiresAt: conference.freeAt,
    }))

    sendEmailStub = sendEmailStub.returns(Promise.resolve())
  }

  it('should create conf and send email', function(done) {
    const conference = {
      id: 'long_uuid',
      phoneNumber: '330122334455',
      pin: 123456789,
      email: 'good.email@thing.com',
      conferenceDay: '2020-12-09',
      userTimezoneOffset: '-180',
      freeAt: new Date(),
    }
    setupStubsForSuccessCase(conference)

    chai.request(app)
      .get(urls.createConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        token: 'long_random_token',
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(getTokenStub)
        sinon.assert.calledOnce(createConfStub)
        sinon.assert.calledOnce(insertConfStub)
        chai.assert(insertConfStub.getCall(0).calledWith(conference.email))
        sinon.assert.calledOnce(sendEmailStub)
        res.should.redirectTo(urls.showConf.replace(":id", conference.id) + '#' + conference.pin)
        done()
      })
  })

  it('should give the created conference info to emailer', function(done) {
    const conference = {
      id: 'long_uuid',
      phoneNumber: '330122334455',
      pin: 123456789,
      email: 'good.email@thing.com',
      conferenceDay: '2020-12-09',
      userTimezoneOffset: '-180',
      freeAt: new Date(),
    }
    setupStubsForSuccessCase(conference)

    chai.request(app)
      .get(urls.createConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        token: 'long_random_token',
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(sendEmailStub)
        const obtainedConference = sendEmailStub.getCall(0).args[0]

        chai.assert.equal(obtainedConference.conferenceDay, conference.conferenceDay)
        chai.assert.equal(obtainedConference.userTimezoneOffset, conference.userTimezoneOffset)
        chai.assert.equal(obtainedConference.phoneNumber, conference.phoneNumber)
        chai.assert.equal(obtainedConference.pin, conference.pin)
        chai.assert.equal(obtainedConference.email, conference.email)

        done()
      })
  })

  it('should redirect when token is bad', function(done) {
    const conference = {
      id: 'long_uuid',
      phoneNumber: '330122334455',
      pin: 123456789,
      email: 'good.email@thing.com',
      conferenceDay: '2020-12-09',
      userTimezoneOffset: '-180',
      freeAt: new Date(),
    }
    setupStubsForSuccessCase(conference)
    // No token found.
    getTokenStub.restore()
    getTokenStub = sinon.stub(db, 'getToken').returns(Promise.resolve([]))

    chai.request(app)
      .get(urls.createConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        token: 'long_random_token',
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

  it('should redirect when conf was not created', function(done) {
    const conference = {
      id: 'long_uuid',
      phoneNumber: '330122334455',
      pin: 123456789,
      email: 'good.email@thing.com',
      conferenceDay: '2020-12-09',
      userTimezoneOffset: '-180',
      freeAt: new Date(),
    }
    setupStubsForSuccessCase(conference)

    // Conf creation errors
    createConfStub.restore()
    createConfStub = sinon.stub(conferences, 'createConf')
      .returns(Promise.reject(new Error('Conf not created aaaaah')))

    chai.request(app)
      .get(urls.createConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        token: 'long_random_token',
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

  it('should redirect when email was not sent', function(done) {
    const conference = {
      id: 'long_uuid',
      phoneNumber: '330122334455',
      pin: 123456789,
      email: 'good.email@thing.com',
      conferenceDay: '2020-12-09',
      userTimezoneOffset: '-180',
      freeAt: new Date(),
    }
    setupStubsForSuccessCase(conference)

    // Email error when sending
    sendEmailStub.restore()
    sendEmailStub = sinon.stub(emailer, 'sendConfCreatedEmail')
      .returns(Promise.reject(new Error('oh no email not sent')))

    chai.request(app)
      .get(urls.createConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        token: 'long_random_token',
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
