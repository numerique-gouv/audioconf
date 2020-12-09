const app = require('../index')
const chai = require('chai')
const config = require('../config')
const db = require('../lib/db')
const emailer = require('../lib/emailer')
const sinon = require('sinon')
const urls = require('../urls')
const testUtils = require('./utils')

describe('sendValidationEmailController', function() {
  let sendEmailStub
  let insertTokenStub
  let EMAIL_WHITELIST_BCK

  beforeEach(function(done) {
    EMAIL_WHITELIST_BCK = config.EMAIL_WHITELIST
    config.EMAIL_WHITELIST = [ /.*@(.*\.|)beta\.gouv\.fr/, /.*@(.*\.|)numerique\.gouv\.fr/ ]
    sendEmailStub = sinon.stub(emailer, 'sendEmailValidationEmail')
      .returns(Promise.resolve())
    insertTokenStub = sinon.stub(db, 'insertToken')
      .returns(Promise.resolve())
    done()
  })

  afterEach(function(done) {
    config.EMAIL_WHITELIST = EMAIL_WHITELIST_BCK
    sendEmailStub.restore()
    insertTokenStub.restore()
    done()
  })

  it('should refuse invalid email', function(done) {
    chai.request(app)
      .post(urls.sendValidationEmail)
      .type('form')
      .send({
        email: 'bad.email',
        day: '2020-12-09',
      })
      .end((err, res) => {
        testUtils.shouldRedirectToLocation(res, urls.landing)
        sinon.assert.notCalled(sendEmailStub)
        sinon.assert.notCalled(insertTokenStub)
        done()
      })
  })

  it('should refuse email that is not in EMAIL_WHITELIST', function(done) {
    chai.request(app)
      .post(urls.sendValidationEmail)
      .type('form')
      .send({
        email: 'bad.email@not.betagouv.fr',
        day: '2020-12-09',
      })
      .end((err, res) => {
        testUtils.shouldRedirectToLocation(res, urls.landing)
        sinon.assert.notCalled(sendEmailStub)
        sinon.assert.notCalled(insertTokenStub)
        done()
      })
  })

})
