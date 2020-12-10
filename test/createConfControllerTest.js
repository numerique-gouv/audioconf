const chai = require('chai')
const sinon = require('sinon')

const app = require('../index')
const conferences = require('../lib/conferences')
const db = require('../lib/db')
const emailer = require('../lib/emailer')
const testUtils = require('./utils')
const urls = require('../urls')

describe('createConfController', function() {
  let createConfStub
  let sendEmailStub
  let getTokenStub
  let insertConfStub
  beforeEach(function(done) {
    createConfStub = sinon.stub(conferences, 'createConf')
    sendEmailStub = sinon.stub(emailer, 'sendConfCreatedEmail')
        .returns(Promise.resolve())
    getTokenStub = sinon.stub(db, 'getToken')
    insertConfStub = sinon.stub(db, 'insertConferenceWithFreeAt')

    done()
  })

  afterEach(function(done) {
    createConfStub.restore()
    sendEmailStub.restore()
    getTokenStub.restore()
    insertConfStub.restore()
    done()
  })
/*
  it('should react when email was not sent', function(done) {
    sendEmailStub.restore()
    sendEmailStub = sinon.stub(emailer, 'sendConfCreatedEmail')
      .rejects('oops')

    chai.request(app)
      .post(urls.createConf)
      .type('form')
      .send({
        email: 'good.email@beta.gouv.fr',
      })
      .end(function(err, res) {
        testUtils.shouldRedirectToLocation(res, urls.landing)
        sinon.assert.calledOnce(createConfStub)
        sinon.assert.calledOnce(sendEmailStub)
        done()
      })
  })*/

  it('should create conf and send email', function(done) {
    const confUUID = 'long_uuid'
    const confPin = 123456789
    getTokenStub = getTokenStub.returns(Promise.resolve([{
      email: 'good.email@thing.com',
      conferenceDay: '2020-12-09',
    }]))
    createConfStub = createConfStub.returns(Promise.resolve(
      { phoneNumber: '+330122334455', pin: confPin, freeAt: new Date() }))
    insertConfStub = insertConfStub.returns(Promise.resolve({
      id: confUUID,
      pin: confPin,
    }))

    chai.request(app)
      .get(urls.createConf)
      .query({
        token: 'long_random_token',
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(getTokenStub)
        sinon.assert.calledOnce(createConfStub)
        sinon.assert.calledOnce(insertConfStub)
        sinon.assert.calledOnce(sendEmailStub)
        testUtils.shouldRedirectToLocation(res, urls.showConf.replace(":id", confUUID) + '#' + confPin)
        done()
      })
  })

  it('should redirect when token is bad', function(done) {
    const confUUID = 'long_uuid'
    const confPin = 123456789
    insertConfStub = insertConfStub.returns(Promise.resolve({
      id: confUUID,
      pin: confPin,
    }))
    createConfStub = createConfStub.returns(Promise.resolve(
      { phoneNumber: '+330122334455', pin: confPin, freeAt: new Date() }))
    // No token found.
    getTokenStub = getTokenStub.returns(Promise.resolve([]))

    chai.request(app)
      .get(urls.createConf)
      .query({
        token: 'long_random_token',
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(getTokenStub)
        sinon.assert.notCalled(createConfStub)
        sinon.assert.notCalled(insertConfStub)
        sinon.assert.notCalled(sendEmailStub)
        testUtils.shouldRedirectToLocation(res, urls.landing)
        done()
      })
  })

  it('should redirect when conf was not created', function(done) {
    const confUUID = 'long_uuid'
    const confPin = 123456789
    insertConfStub = insertConfStub.returns(Promise.resolve({
      id: confUUID,
      pin: confPin,
    }))
    getTokenStub = getTokenStub.returns(Promise.resolve([{
      email: 'good.email@thing.com',
      conferenceDay: '2020-12-09',
    }]))
    // Conf creation errors
    createConfStub = createConfStub.returns(Promise.reject(new Error('Conf not created aaaaah')))

    chai.request(app)
      .get(urls.createConf)
      .query({
        token: 'long_random_token',
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(getTokenStub)
        sinon.assert.calledOnce(createConfStub)
        sinon.assert.notCalled(insertConfStub)
        sinon.assert.notCalled(sendEmailStub)
        testUtils.shouldRedirectToLocation(res, urls.landing)
        done()
      })
  })


})
