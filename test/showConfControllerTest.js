const app = require('../index')
const chai = require('chai')
const db = require('../lib/db')
const sinon = require('sinon')
const urls = require('../urls')

describe('showConfController', function() {
  let getConfStub
  beforeEach(function() {
    getConfStub = sinon.stub(db, 'getUnexpiredConference')
  })

  afterEach(function() {
    getConfStub.restore()
  })

  it('should show conf', function(done) {
    const confUUID = 'long-id-long-long'
    const conferenceDay = '2020-12-10'
    const phoneNumber = '0033122334455'

    getConfStub = getConfStub.returns(Promise.resolve({
      id: confUUID,
      email: 'martin.rauch@ddr.de',
      phoneNumber: phoneNumber,
      expiresAt: new Date(`${conferenceDay} 23:59:59 GMT+3`),
    }))

    chai.request(app)
      .get(urls.showConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        id: confUUID,
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(getConfStub)
        chai.expect(res.text).to.have.string('10 décembre 2020')
        chai.expect(res.text).to.have.string('01 22 33 44 55')
        chai.expect(res.text).to.have.string('toute la journée') // day conf

        done()
      })
  })

  it('should redirect to landing page if the conf does not exist', function(done) {
    const confUUID = 'a-fake-conf-id'

    getConfStub = getConfStub.returns(Promise.reject(new Error('conf does not exist dude')))

    chai.request(app)
      .get(urls.showConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        id: confUUID,
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(getConfStub)
        res.should.redirectTo(urls.landing)
        done()
      })
  })

  it('should redirect to landing page if the conf is expired', function(done) {
    const confUUID = 'an-expired-conf-id'

    getConfStub = getConfStub.returns(Promise.resolve())

    chai.request(app)
      .get(urls.showConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        id: confUUID,
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(getConfStub)
        res.should.redirectTo(urls.landing)
        done()
      })
  })

  it('should redirect to landing page if the conf is canceled', function(done) {
    const confUUID = 'a-canceled-conf-id'
    const conferenceDay = '2020-12-10'
    const phoneNumber = '0033122334455'

    getConfStub = getConfStub.returns(Promise.resolve({
      id: confUUID,
      email: 'martin.rauch@ddr.de',
      phoneNumber: phoneNumber,
      expiresAt: new Date(`${conferenceDay} 23:59:59 GMT+3`),
      canceledAt: new Date(),
    }))

    chai.request(app)
      .get(urls.showConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        id: confUUID,
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(getConfStub)
        res.should.redirectTo(urls.landing)
        done()
      })
    })
})