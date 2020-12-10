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
        done()
      })
  })

  it('should show PIN if passed in hash', function(done) {
    done()
  })

})