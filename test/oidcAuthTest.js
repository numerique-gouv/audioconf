const { expect } = require("chai")
const sinon = require("sinon")

const db = require("../lib/db")
const oidcAuth = require("../lib/oidcAuth")

describe("oidcAuth", function() {
  let oidcClientStub
  let insertOidcRequestStub

  beforeEach(function() {
    oidcClientStub = sinon.stub(oidcAuth, "getClient")
    insertOidcRequestStub = sinon.stub(db, "insertOidcRequest")
  })

  afterEach(function() {
    oidcClientStub.restore()
    insertOidcRequestStub.restore()
  })

  it("should insert oidc request in db", async () => {
    const redirectUrl = "/hello-redirect"
    const authorizationUrlStub = sinon.stub()
    authorizationUrlStub.returns(redirectUrl)
    oidcClientStub.returns(Promise.resolve({
      authorizationUrl: authorizationUrlStub,
    }))
    insertOidcRequestStub.returns(Promise.resolve())

    const email = "good.email@beta.gouv.fr"
    const conferenceDayString = "2022-05-25"
    const userTimezoneOffset = 60

    const request = await oidcAuth.startAuth(
      email,
      undefined, //conferenceDurationInMinutes,
      conferenceDayString,
      userTimezoneOffset,
    )

    expect(request.redirectUrl).to.equal(redirectUrl)
    sinon.assert.calledOnce(insertOidcRequestStub)
    sinon.assert.calledWith(insertOidcRequestStub.getCall(0),
      sinon.match.string, // state,
      undefined, // conferenceDurationInMinutes,
      conferenceDayString,
      userTimezoneOffset
    )

    sinon.assert.calledWith(authorizationUrlStub.getCall(0),
      {
        login_hint: email,
        scope: "openid",
        state: sinon.match.string,
      }
    )
  })
})
