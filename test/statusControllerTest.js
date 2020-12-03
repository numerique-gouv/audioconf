const chai = require('chai')
const sinon = require('sinon')

const app = require('../index')
const urls = require('../urls')

describe('statusController', function() {
  beforeEach(function(done) {
    done()
  })

  afterEach(function(done) {
    done()
  })

  it('should return 200 when all is well', function(done) {
    chai.request(app)
      .get(urls.status)
      .end((err, res) => {
        chai.assert(res.status === 200, 'HTTP status is 200')
        chai.assert(res.body.status, 'status is true')
        chai.assert(res.body.OVHStatus, 'OVHStatus is true')
        chai.assert(res.body.DBStatus, 'DBStatus is true')
        done()
      })
  })

})