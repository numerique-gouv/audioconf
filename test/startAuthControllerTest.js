const app = require("../index")
const chai = require("chai")
const magicLinkAuth = require("../lib/magicLinkAuth")
const oidcAuth = require("../lib/oidcAuth")
const sinon = require("sinon")
const urls = require("../urls")
const config = require("../config")

describe("startAuthController", function() {
  let featureFlagValue

  beforeEach(function(done) {
    featureFlagValue = config.FEATURE_OIDC
    done()
  })

  afterEach(function(done) {
    config.FEATURE_OIDC = featureFlagValue
    done()
  })

  describe("using magicLinkAuth", function() {
    let magicLinkAuthStub

    beforeEach(function() {
      magicLinkAuthStub = sinon.stub(magicLinkAuth, "startAuth")
      config.FEATURE_OIDC = false
    })

    afterEach(function() {
      magicLinkAuthStub.restore()
    })


    it("should redirect to landing page if startAuth failed", function(done) {
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

    it("should redirect to redirectUrl if startAuth succeeded", function(done) {
      const redirectUrl = "/my-redirect-url"

      magicLinkAuthStub.returns(Promise.resolve({ redirectUrl }))

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

  describe("using oidcAuth", function() {
    let oidcClientStub

    beforeEach(function() {
      oidcClientStub = sinon.stub(oidcAuth, "startAuth")
      config.FEATURE_OIDC = true
    })

    afterEach(function() {
      oidcClientStub.restore()
    })

    it("should redirect to landing page if startAuth failed", function(done) {
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

    it("should redirect to redirectUrl if startAuth succeeded", function(done) {
      config.FEATURE_OIDC = true
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
