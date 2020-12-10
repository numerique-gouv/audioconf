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

    getConfStub = getConfStub.returns(Promise.resolve({
      id: confUUID,
      email: 'martin.rauch@ddr.de',
      phoneNumber: '0033122334455',
      expiresAt: new Date(),
    }))

    chai.request(app)
      .get(urls.showConf)
      .redirects(0) // block redirects, we don't want to test them
      .query({
        id: confUUID,
      })
      .end(function(err, res) {
        sinon.assert.calledOnce(getConfStub)
        chai.expect(res.text).to.have.string('réservée')
        done()
      })
  })

  it('should show PIN if passed in hash', function(done) {
    done()
  })

})