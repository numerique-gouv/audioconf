const app = require('../index')
const chai = require('chai')
const db = require('../lib/db')
const emailer = require('../lib/emailer')
const sinon = require('sinon')
const urls = require('../urls')
const testUtils = require('./utils')

describe('sendValidationEmailController', function() {
  let sendEmailStub
  let insertTokenStub

  beforeEach(function(done) {
    sendEmailStub = sinon.stub(emailer, 'sendEmailValidationEmail')
      .returns(Promise.resolve())
    insertTokenStub = sinon.stub(db, 'insertToken')
      .returns(Promise.resolve())
    done()
  })

  afterEach(function(done) {
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
})
