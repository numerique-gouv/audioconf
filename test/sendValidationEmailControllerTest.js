const app = require("../index")
const chai = require("chai")
const db = require("../lib/db")
const magicLinkAuth = require("../lib/magicLinkAuth")
const sinon = require("sinon")
const urls = require("../urls")

describe("sendValidationEmailController", function() {
  let insertTokenStub, magicLinkAuthStub

  beforeEach(function(done) {
    insertTokenStub = sinon.stub(db, "insertToken")
      .returns(Promise.resolve())
    magicLinkAuthStub = sinon.stub(magicLinkAuth, "authStart")
    done()
  })

  afterEach(function(done) {
    insertTokenStub.restore()
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
        sinon.assert.notCalled(insertTokenStub)
        done()
      })
  })

  it("should store request in db if authStart succeeded", function(done) {
    magicLinkAuthStub.returns(Promise.resolve({ token: "mytoken", tokenExpirationDate: new Date() }))

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
        sinon.assert.calledOnce(insertTokenStub)
        done()
      })
  })
})
