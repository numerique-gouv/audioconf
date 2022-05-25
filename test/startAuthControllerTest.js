const app = require("../index")
const chai = require("chai")
const magicLinkAuth = require("../lib/magicLinkAuth")
const oidcAuth = require("../lib/oidcAuth")
const sinon = require("sinon")
const urls = require("../urls")
const config = require("../config")

describe("startAuthController", function() {
  let magicLinkAuthStub
  let oidcClientStub

  beforeEach(function(done) {
    magicLinkAuthStub = sinon.stub(magicLinkAuth, "startAuth")
    oidcClientStub = sinon.stub(oidcAuth, "startAuth")
    done()
  })

  afterEach(function(done) {
    magicLinkAuthStub.restore()
    oidcClientStub.restore()
    done()
  })

  it("MAGIC_LINK - should not store request in db if startAuth failed", function(done) {
    config.FEATURE_OIDC = false

    magicLinkAuthStub.returns(Promise.resolve({ error: "something went wrong"}))

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

  it("MAGIC_LINK - should store request in db if startAuth succeeded", function(done) {
    config.FEATURE_OIDC = false

    magicLinkAuthStub.returns(Promise.resolve({ redirectUrl: urls.validationEmailSent + "?email=me%40email.com" }))

    chai.request(app)
      .post(urls.startAuth)
      .redirects(0) // block redirects, we don't want to test them
      .type("form")
      .send({
        email: "me@email.com",
        day: "2020-12-09",
      })
      .end((err, res) => {
        res.should.redirectTo(urls.validationEmailSent + "?email=me%40email.com")
        done()
      })
  })

  it("FEATURE_OIDC - should not store request in db if startAuth failed", function(done) {
    config.FEATURE_OIDC = true

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

  it("FEATURE_OIDC - should store request in db if startAuth succeeded", function(done) {
    config.FEATURE_OIDC = true

    oidcClientStub.returns(Promise.resolve({ redirectUrl: urls.validationEmailSent + "?email=me%40email.com" }))

    chai.request(app)
      .post(urls.startAuth)
      .redirects(0) // block redirects, we don't want to test them
      .type("form")
      .send({
        email: "me@email.com",
        day: "2020-12-09",
      })
      .end((err, res) => {
        res.should.redirectTo(urls.validationEmailSent + "?email=me%40email.com")
        done()
      })
  })
})
