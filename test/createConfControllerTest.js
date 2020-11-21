const chai = require('chai')
const sinon = require('sinon')
const app = require('../index')
const conferences = require('../lib/conferences')
const config = require('../config')
const emailer = require('../lib/emailer')
const urls = require('../urls')
const db = require('../lib/db')

const shouldRedirectToLocation = (res, location) => {
  // Escape slashes for regex
  const escapedLocation = location.replace('/', '\/')
  res.should.redirectTo(new RegExp(`^http:\/\/127.0.0.1:[0-9]+${escapedLocation}$`))
}

describe('createConfController', function() {
  let createConfStub
  let sendEmailStub
  let getToken
  let getAllPhoneNumbers
  let insertConference
  
  beforeEach(function(done) {
    config.EMAIL_WHITELIST = [ /.*@(.*\.|)beta\.gouv\.fr/, /.*@(.*\.|)numerique\.gouv\.fr/ ]
    
    createConfStub = sinon.stub(conferences, 'createConf')
        .returns(Promise.resolve({ phoneNumber: '0122334455', id: 123456,pin:2334}))
    getToken = sinon.stub(db, 'getToken').returns(Promise.resolve([{email:'email',durationInMinutes:1,conferenceDay:1}]))
    insertConference = sinon.stub(db, 'insertConference').returns(Promise.resolve({pin:"4545",phoneNumber:54646664,id:8787}))
    getAllPhoneNumbers = sinon.stub(conferences, 'getAllPhoneNumbers').returns(Promise.resolve())
    sendEmailStub = sinon.stub(emailer, 'sendConfCreatedEmail')
        .returns(Promise.resolve())
    done()
  })

  afterEach(function(done) {
    createConfStub.restore()
    sendEmailStub.restore()
    getToken.restore()
    insertConference.restore()
    getAllPhoneNumbers.restore()
    done()
  })

  it('should refuse invalid email', function(done) {
    chai.request(app)
      .get(urls.createConf)
      .type('form')
      .send({
        email: 'bad.email',
      })
      .end((err, res) => {
        shouldRedirectToLocation(res, urls.landing)
        sinon.assert.notCalled(createConfStub)
        sinon.assert.notCalled(sendEmailStub)
        done()
      })
  })

  it('should refuse email that is not in EMAIL_WHITELIST', function(done) {
    chai.request(app)
      .get(urls.createConf)
      .type('form')
      .send({
        email: 'bad.email@not.gouv.fr',
      })
      .end((err, res) => {
        shouldRedirectToLocation(res, urls.landing)
        sinon.assert.notCalled(createConfStub)
        sinon.assert.notCalled(sendEmailStub)
        done()
      })
  })

  it('should react when conf was not created', function(done) {
    createConfStub.restore()
    createConfStub = sinon.stub(conferences, 'createConf')
      .rejects('oops')
    getToken.restore()
    getToken = sinon.stub(db, 'getToken').returns(Promise.resolve([{email:'good.email@beta.gouv.fr',durationInMinutes:1,conferenceDay:1}]))
    chai.request(app)
      .get(urls.createConf)
      .type('form')
      .send({
        email: 'good.email@beta.gouv.fr',
      })
      .end(function(err, res) {
        shouldRedirectToLocation(res, urls.landing)
        sinon.assert.calledOnce(createConfStub)
        sinon.assert.notCalled(sendEmailStub)
        done()
      })
  })

  it('should react when email was not sent', function(done) {
    sendEmailStub.restore()
    sendEmailStub = sinon.stub(emailer, 'sendConfCreatedEmail')
      .rejects('oops')
    
    getToken.restore()
    getToken = sinon.stub(db, 'getToken').returns(Promise.resolve([{email:'good.email@beta.gouv.fr',durationInMinutes:1,conferenceDay:1}]))
    chai.request(app)
      .get(urls.createConf)
      .type('form')
      .send({
        email: 'good.email@beta.gouv.fr',
      })
      .end(function(err, res) {
        shouldRedirectToLocation(res, urls.landing)
        sinon.assert.calledOnce(createConfStub)
        sinon.assert.calledOnce(sendEmailStub)
        done()
      })
  })

  it('should create conf and send email', function(done) {
    getToken.restore()
    getToken = sinon.stub(db, 'getToken').returns(Promise.resolve([{email:'good.email@beta.gouv.fr',durationInMinutes:1,conferenceDay:1}]))
    chai.request(app)
    .get(urls.createConf)
    .type('form')
      .send({
        email: 'good.email@beta.gouv.fr',
      })
      .end(function(err, res) {
        shouldRedirectToLocation(res, "/conferences/8787#2334")
        sinon.assert.calledOnce(createConfStub)
        sinon.assert.calledOnce(sendEmailStub)
        done()
      })
  })
})
