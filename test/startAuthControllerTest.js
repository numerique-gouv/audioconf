const app = require("../index")
const chai = require("chai")
const oidcAuth = require("../lib/oidcAuth")
const sinon = require("sinon")
const urls = require("../urls")

describe("userController", function() {

  describe("using oidcAuth", function() {
    let oidcClientStub

    beforeEach(function() {
      oidcClientStub = sinon.stub(oidcAuth, "startAuth")
    })

    afterEach(function() {
      oidcClientStub.restore()
    })

    it("should redirect to landing page if startAuth failed", function(done) {
      oidcClientStub.returns(Promise.resolve({ error: "something went wrong"}))

      chai.request(app)
        .post(urls.startAuth)
        .redirects(0) // block redirects, we don't want to test them
        .type("form")
        .send({
          email: "email",
          day: "2020-12-09",
        })
        .end((err, res) => {
          res.should.redirectTo(urls.landing)
          done()
        })
    })

    it("should redirect to redirectUrl if startAuth succeeded", function(done) {
      const redirectUrl = "/my-redirect-url"

      oidcClientStub.returns(Promise.resolve({ redirectUrl }))

      chai.request(app)
        .post(urls.startAuth)
        .redirects(0) // block redirects, we don't want to test them
        .type("form")
        .send({
          email: "me@email.com",
          day: "2020-12-09",
        })
        .end((err, res) => {
          res.should.redirectTo(redirectUrl)
          done()
        })
    })

  })
})
