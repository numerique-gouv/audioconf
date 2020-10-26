const chai = require('chai')
const sinon = require('sinon')

const app = require('../index')
const conferences = require('../lib/conferences')
const emailer = require('../lib/emailer')

describe('createConfController', function() {
  beforeEach(function(done) {
    this.createConfStub = sinon.stub(conferences, 'createConf')
        .returns(Promise.resolve({ phoneNumber: '0122334455', id: 123456}))
    this.sendEmailStub = sinon.stub(emailer, 'sendConfCreatedEmail')
        .returns(Promise.resolve())
    done()
  })

  afterEach(function(done) {
    this.createConfStub.restore()
    this.sendEmailStub.restore()
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
        res.should.redirectTo('http://127.0.0.1:8080/')
        sinon.assert.notCalled(this.createConfStub)
        sinon.assert.notCalled(this.sendEmailStub)
        done()
      })
  })
})
