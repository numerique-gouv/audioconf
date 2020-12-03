const chai = require('chai')
const sinon = require('sinon')

const app = require('../index')
const conferences = require('../lib/conferences')
const config = require('../config')
const knex = require('knex')
const urls = require('../urls')

describe('statusController', function() {
  const { DATABASE_URL, USE_OVH_ROOM_API } = config
  let getRoomsStatsStub
  let knexStub
  beforeEach(function(done) {
    config.USE_OVH_ROOM_API = true
    getRoomsStatsStub = sinon.stub(conferences, 'getRoomsStats')
      .returns(Promise.resolve({coucou: "123"}))
    done()
  })

  afterEach(function(done) {
    getRoomsStatsStub.restore()
    config.DATABASE_URL = DATABASE_URL
    config.USE_OVH_ROOM_API = USE_OVH_ROOM_API
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

  it('should return 500 when DB is down', function(done) {
    config.DATABASE_URL = 'this database does not exist'

    chai.request(app)
      .get(urls.status)
      .end((err, res) => {
        chai.assert(res.status === 500, 'HTTP status is 500')
        chai.assert(!res.body.status, 'status is false')
        chai.assert(res.body.OVHStatus, 'OVHStatus is true')
        chai.assert(!res.body.DBStatus, 'DBStatus is false')
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

  it('should return 500 when OVH and DB are down', function(done) {
    getRoomsStatsStub.restore()
    getRoomsStatsStub = sinon.stub(conferences, 'getRoomsStats')
      .returns(Promise.reject('OVH is dowwwwwwnnnnn'))
    config.DATABASE_URL = 'this database does not exist'

    chai.request(app)
      .get(urls.status)
      .end((err, res) => {
        chai.assert(res.status === 500, 'HTTP status is 500')
        chai.assert(!res.body.status, 'status is false')
        chai.assert(!res.body.OVHStatus, 'OVHStatus is false')
        chai.assert(!res.body.DBStatus, 'DBStatus is false')
        done()
      })
  })

})