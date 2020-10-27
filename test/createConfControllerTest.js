const chai = require('chai')
const sinon = require('sinon')

const app = require('../index')
const conferences = require('../lib/conferences')
const config = require('../config')
const emailer = require('../lib/emailer')

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

  it('should refuse invalid email', function(done) {
    chai.request(app)
      .post('/create-conf')
      .type('form')
      .send({
        email: 'bad.email',
      })
      .end((err, res) => {
        res.should.redirectTo(/^http:\/\/127.0.0.1:[0-9]+\/$/)
        sinon.assert.notCalled(createConfStub)
        sinon.assert.notCalled(sendEmailStub)
        done()
      })
  })

  it('should refuse email that is not in EMAIL_WHITELIST', function(done) {
    chai.request(app)
      .post('/create-conf')
      .type('form')
      .send({
        email: 'bad.email@not.gouv.fr',
      })
      .end((err, res) => {
        res.should.redirectTo(/^http:\/\/127.0.0.1:[0-9]+\/$/)
        sinon.assert.notCalled(createConfStub)
        sinon.assert.notCalled(sendEmailStub)
        done()
      })
  })

  it('should create conf and send email', function(done) {
    chai.request(app)
      .post('/create-conf')
      .type('form')
      .send({
        email: 'good.email@beta.gouv.fr',
      })
      .end(function(err, res) {
        res.should.redirectTo(/^http:\/\/127.0.0.1:[0-9]+\/conf-created$/)
        sinon.assert.calledOnce(createConfStub)
        sinon.assert.calledOnce(sendEmailStub)
        done()
      })
  })
})
