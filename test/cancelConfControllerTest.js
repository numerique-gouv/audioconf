const app = require('../index')
const chai = require('chai')
const db = require('../lib/db')
const sinon = require('sinon')
const urls = require('../urls')

describe('cancelConfController', function() {
  let cancelConfStub
  beforeEach(function() {
    cancelConfStub = sinon.stub(db, 'cancelConference')
  })

  afterEach(function() {
    cancelConfStub.restore()
  })

  it('should cancel conf', function(done) {
    const confUUID = 'long-id-long-long'

    cancelConfStub = cancelConfStub.returns(Promise.resolve())

    chai.request(app)
      .post(urls.cancelConf.replace(":id", confUUID))
      .redirects(0) // block redirects, we don't want to test them
      .end(function(err, res) {
        sinon.assert.calledOnce(cancelConfStub)
        res.should.redirectTo(urls.landing)

        done()
      })
  })
})
