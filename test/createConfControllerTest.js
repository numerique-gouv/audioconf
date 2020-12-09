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
        .returns(Promise.resolve({ phoneNumber: '+330122334455', pin: 123456789, freeAt: new Date() }))
    sendEmailStub = sinon.stub(emailer, 'sendConfCreatedEmail')
        .returns(Promise.resolve())
    getTokenStub = sinon.stub(db, 'getToken')
        .returns(Promise.resolve([{
          email: 'good.email@thing.com',
          conferenceDay: '2020-12-09',
        }]))
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

  it('should react when conf was not created', function(done) {
    createConfStub.restore()
    createConfStub = sinon.stub(conferences, 'createConf')
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
        sinon.assert.notCalled(sendEmailStub)
        done()
      })
  })

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
  })

  it('should create conf and send email', function(done) {
    const confUUID = 'long_uuid'
    const confPin = 123456789
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
})
