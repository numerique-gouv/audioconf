const { expect } = require("chai")

const config = require("../config")
const emailer = require("../lib/emailer")
const sinon = require("sinon")

const magicLinkAuth = require("../lib/magicLinkAuth")

describe("magicLinkAuth", function() {
  let sendEmailStub
  let EMAIL_WHITELIST_BCK

  beforeEach(function(done) {
    EMAIL_WHITELIST_BCK = config.EMAIL_WHITELIST
    config.EMAIL_WHITELIST = [ /.*@(.*\.|)beta\.gouv\.fr/, /.*@(.*\.|)numerique\.gouv\.fr/ ]
    sendEmailStub = sinon.stub(emailer, "sendEmailValidationEmail")
      .returns(Promise.resolve())
    done()
  })

  afterEach(function(done) {
    config.EMAIL_WHITELIST = EMAIL_WHITELIST_BCK
    sendEmailStub.restore()
    done()
  })

  it("should refuse invalid email", async function() {
    const email = "bad.email"
    const request = await magicLinkAuth.authStart(email)

    expect(request).to.have.own.property("error")
    sinon.assert.notCalled(sendEmailStub)
  })

  it("should refuse email that is not in EMAIL_WHITELIST", async function() {
    const email = "bad.email@not.betagouv.fr"
    const request = await magicLinkAuth.authStart(email)

    expect(request).to.have.own.property("error")
    sinon.assert.notCalled(sendEmailStub)
  })

})
