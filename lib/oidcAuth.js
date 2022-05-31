/**
 * Usage :
 * const authRequest = startAuth(email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
 *
 * If fail
 * authRequest == { error: "error message"}
 *
 * If success
 * authRequest == { redirectUrl : "<url>" }
 */
const { generators, Issuer } = require("openid-client")
const config = require("../config.js")
const urls = require("../urls")
const db = require("../lib/db")
const format = require("../lib/format")

const urlCallback = urls.createConf

module.exports.getClient = async () => {
  const issuer = await Issuer.discover(config.OIDC_PROVIDER_URL)

  const client = new issuer.Client({
      client_id: config.OIDC_CLIENT_ID,
      client_secret: config.OIDC_CLIENT_SECRET,
      redirect_uris: [config.HOSTNAME_WITH_PROTOCOL + urlCallback],
      response_types: ["code"],
         // id_token_signed_response_alg (default "RS256")
         // token_endpoint_auth_method (default "client_secret_basic")
  })

  return client
}

module.exports.startAuth = async (email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset) => {
  const client = await this.getClient()

  /* todo : store the code_verifier in DB. We don't use it for now.
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  */

  // "state" will be sent back by the id server at the end of the flow. We use it to identify the auth request.
  const state = generators.random(128)
  const nonce = generators.random(128)

  const redirectUrl = client.authorizationUrl({
      scope: "openid",
      state,
      /* todo add this back
      code_challenge,
      code_challenge_method: 'S256',
      */
      nonce,
      login_hint: email
  })

  try {
    await db.insertOidcRequest(state, nonce, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
    console.log(`OIDC request créé pour ${format.hashForLogs(email)}`)
  } catch(err) {
    console.log("Error when inserting authrequest token in DB", err)
    return { error: "Une erreur interne s'est produite, nous n'avons pas pu créer votre conférence." }
  }

  // todo : how to deal with expiration of request in oidc ?
  return { redirectUrl }
}

module.exports.finishAuth = async (req) => {
  const client = await this.getClient()
  const params = client.callbackParams(req)

  // todo : fetch code_verifier from DB. If no code_verifier, abort.

  const tokenSet = await client.callback(
    config.HOSTNAME_WITH_PROTOCOL + urlCallback,
    params,
    {
      state: params.state,
      nonce: params.nonce
      // todo  code_verifier: req.session.code_verifier
    }
  )
  // Todo : the email is already present in the Base64 encoded tokenSet.id_token. We could decode it instead of doing the
  // userInfo request. (why would it be better ? investigate.)
  const userInfo = await client.userinfo(tokenSet)

  const email = userInfo.preferred_username

  const state = params.state
  try {
    // TODO : move the retrival of the OidcRequest before await client.callback (l.75)
    const requests = await db.getOidcRequest(state)

    const isRequestValid = requests.length === 1
    if (!isRequestValid) {
      // todo use propoer error codes ?
      return { error: "L'identification a échoué. Entrez votre email ci-dessous pour recommencer." }
    }
    const request = requests[0]

    return {
      email,
      durationInMinutes: request.durationInMinutes,
      conferenceDay: request.conferenceDay,
      userTimezoneOffset: request.userTimezoneOffset
    }
  } catch (e) {
    console.error("error when fetching oidc request from DB", e)
    return { error: "L'identification a échoué. Entrez votre email ci-dessous pour recommencer." }
  }
}

