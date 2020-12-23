const chai = require("chai")
const sinon = require("sinon")

const app = require("../index")
const conferences = require("../lib/conferences")
const config = require("../config")
const db = require("../lib/db")
const urls = require("../urls")

describe("statusController", function() {
  const { DATABASE_URL } = config
  let getRoomsStatsStub
  let getDBStatusStub
  beforeEach(function(done) {
    getRoomsStatsStub = sinon.stub(conferences, "getRoomsStats")
      .returns(Promise.resolve({coucou: "123"}))
    getDBStatusStub = sinon.stub(db, "getDBStatus")
      .returns(Promise.resolve(true))
    done()
  })

  afterEach(function(done) {
    getRoomsStatsStub.restore()
    getDBStatusStub.restore()
    config.DATABASE_URL = DATABASE_URL
    done()
  })

  it("should return 200 when all is well", function(done) {
    chai.request(app)
      .get(urls.status)
      .end((err, res) => {
        chai.assert(res.status === 200, "HTTP status is 200")
        chai.assert(res.body.status, "status is true")
        chai.assert(res.body.OVHStatus, "OVHStatus is true")
        chai.assert(res.body.DBStatus, "DBStatus is true")
        done()
      })
  })

  it("should return 500 when DB is down", function(done) {
    getDBStatusStub.restore()
    getDBStatusStub = sinon.stub(db, "getDBStatus")
      .returns(Promise.resolve(false))

    chai.request(app)
      .get(urls.status)
      .end((err, res) => {
        chai.assert(res.status === 500, "HTTP status is 500")
        chai.assert(!res.body.status, "status is false")
        chai.assert(res.body.OVHStatus, "OVHStatus is true")
        chai.assert(!res.body.DBStatus, "DBStatus is false")
        done()
      })
  })

  it("should return 500 when OVH is down", function(done) {
    getRoomsStatsStub.restore()
    getRoomsStatsStub = sinon.stub(conferences, "getRoomsStats")
      .returns(Promise.reject("OVH is dowwwwwwnnnnn"))

    chai.request(app)
      .get(urls.status)
      .end((err, res) => {
        chai.assert(res.status === 500, "HTTP status is 500")
        chai.assert(!res.body.status, "status is false")
        chai.assert(!res.body.OVHStatus, "OVHStatus is false")
        chai.assert(res.body.DBStatus, "DBStatus is true")
        done()
      })
  })

  it("should return 500 when OVH and DB are down", function(done) {
    getRoomsStatsStub.restore()
    getRoomsStatsStub = sinon.stub(conferences, "getRoomsStats")
      .returns(Promise.reject("OVH is dowwwwwwnnnnn"))
    getDBStatusStub.restore()
    getDBStatusStub = sinon.stub(db, "getDBStatus")
      .returns(Promise.resolve(false))

    chai.request(app)
      .get(urls.status)
      .end((err, res) => {
        chai.assert(res.status === 500, "HTTP status is 500")
        chai.assert(!res.body.status, "status is false")
        chai.assert(!res.body.OVHStatus, "OVHStatus is false")
        chai.assert(!res.body.DBStatus, "DBStatus is false")
        done()
      })
  })

})