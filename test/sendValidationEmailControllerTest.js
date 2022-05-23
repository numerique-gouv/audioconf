const app = require("../index")
const chai = require("chai")
const magicLinkAuth = require("../lib/magicLinkAuth")
const sinon = require("sinon")
const urls = require("../urls")

describe("sendValidationEmailController", function() {
  let magicLinkAuthStub

  beforeEach(function(done) {
    magicLinkAuthStub = sinon.stub(magicLinkAuth, "authStart")
    done()
  })

  afterEach(function(done) {
    magicLinkAuthStub.restore()
    done()
  })

  it("should not store request in db if authStart failed", function(done) {
    magicLinkAuthStub.returns(Promise.resolve({ error: "something went wrong"}))

    chai.request(app)
      .post(urls.sendValidationEmail)
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

  it("should store request in db if authStart succeeded", function(done) {
    magicLinkAuthStub.returns(Promise.resolve({ redirectUrl: urls.validationEmailSent + "?email=me%40email.com" }))

    chai.request(app)
      .post(urls.sendValidationEmail)
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
