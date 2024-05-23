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
    oidcClientStub.returns(Promise.resolve({
      authorizationUrl: () => "/hello-redirect",
    }))
    insertOidcRequestStub.returns(Promise.resolve())

    const conferenceDayString = "2022-05-25"
    const userTimezoneOffset = 60

    await oidcAuth.startAuth(
      undefined, //conferenceDurationInMinutes,
      conferenceDayString,
      userTimezoneOffset,
    )

    sinon.assert.calledOnce(insertOidcRequestStub)
    sinon.assert.calledWith(insertOidcRequestStub.getCall(0),
      sinon.match.string, // state,
      sinon.match.string, // nonce,
      undefined, // conferenceDurationInMinutes,
      conferenceDayString,
      userTimezoneOffset
    )
  })

  it("should generate the redirect url", async () => {
    const redirectUrl = "/hello-redirect"
    const authorizationUrlStub = sinon.stub()
    authorizationUrlStub.returns(redirectUrl)
    oidcClientStub.returns(Promise.resolve({
      authorizationUrl: authorizationUrlStub,
    }))
    insertOidcRequestStub.returns(Promise.resolve())

    const conferenceDayString = "2022-05-25"
    const userTimezoneOffset = 60

    const request = await oidcAuth.startAuth(
      undefined, //conferenceDurationInMinutes,
      conferenceDayString,
      userTimezoneOffset,
    )

    expect(request.redirectUrl).to.equal(redirectUrl)
    sinon.assert.calledWith(authorizationUrlStub.getCall(0),
      {
        scope: "openid",
        state: sinon.match.string,
        nonce: sinon.match.string,
      }
    )
  })

  /**
   * A possible mega-stub for Client, if we need it.

    const oidcClientStub = sinon.stub(oidcAuth, "getClient")
    oidcClientStub.returns(Promise.resolve({
      callback: () => ({
        access_token: "myAccessToken",
        expires_at: 1653316281,
        refresh_expires_in: 60,
        refresh_token: "myRefreshToken",
        token_type: "Bearer",
        id_token: "myIdToken",
        "not-before-polic": 0,
        session_state: "mySessionState",
        scope: "openid profile email"
      }),
      callbackParams: () => ({ state: "myState"}),
      authorizationUrl: () => "myRedirectUrl",
      userinfo: () => ({
        sub: "mySub",
        email_verified: false,
        preferred_username: "good.email@thing.com"
      })
    }))

   */
})
