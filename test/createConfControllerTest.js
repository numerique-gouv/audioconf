const chai = require('chai')
const sinon = require('sinon')

const app = require('../index')
const conferences = require('../lib/conferences')
const config = require('../config')
const emailer = require('../lib/emailer')
const testUtils = require('./utils')
const urls = require('../urls')

describe('createConfController', function() {
  let createConfStub
  let sendEmailStub
  beforeEach(function(done) {
    config.EMAIL_WHITELIST = [ /.*@(.*\.|)beta\.gouv\.fr/, /.*@(.*\.|)numerique\.gouv\.fr/ ]
    createConfStub = sinon.stub(conferences, 'createConf')
        .returns(Promise.resolve({ phoneNumber: '0122334455', id: 123456}))
    sendEmailStub = sinon.stub(emailer, 'sendConfCreatedEmail')
        .returns(Promise.resolve())
    done()
  })

  afterEach(function(done) {
    createConfStub.restore()
    sendEmailStub.restore()
    done()
  })

  it('should refuse email that is not in EMAIL_WHITELIST', function(done) {
    chai.request(app)
      .post(urls.createConf)
      .type('form')
      .send({
        email: 'bad.email@not.gouv.fr',
      })
      .end((err, res) => {
        testUtils.shouldRedirectToLocation(res, urls.landing)
        sinon.assert.notCalled(createConfStub)
        sinon.assert.notCalled(sendEmailStub)
        done()
      })
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
    chai.request(app)
    .post(urls.createConf)
    .type('form')
      .send({
        email: 'good.email@beta.gouv.fr',
      })
      .end(function(err, res) {
        testUtils.shouldRedirectToLocation(res, urls.confCreated)
        sinon.assert.calledOnce(createConfStub)
        sinon.assert.calledOnce(sendEmailStub)
        done()
      })
  })
})
