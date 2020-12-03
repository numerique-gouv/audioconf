const chai = require('chai')
const sinon = require('sinon')

const app = require('../index')
const conferences = require('../lib/conferences')
const config = require('../config')
const urls = require('../urls')

describe('statusController', function() {
  config.USE_OVH_ROOM_API = true
  let getRoomsStatsStub
  beforeEach(function(done) {
    getRoomsStatsStub = sinon.stub(conferences, 'getRoomsStats')
      .returns(Promise.resolve({coucou: "123"}))
    done()
  })

  afterEach(function(done) {
    getRoomsStatsStub.restore()
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

  it('should return 500 when OVH is down', function(done) {
    getRoomsStatsStub.restore()
    getRoomsStatsStub = sinon.stub(conferences, 'getRoomsStats')
      .returns(Promise.reject('OVH is dowwwwwwnnnnn'))

    chai.request(app)
      .get(urls.status)
      .end((err, res) => {
        chai.assert(res.status === 500, 'HTTP status is 500')
        chai.assert(!res.body.status, 'status is false')
        chai.assert(!res.body.OVHStatus, 'OVHStatus is false')
        chai.assert(res.body.DBStatus, 'DBStatus is true')
        done()
      })
  })

})