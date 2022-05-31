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
  // "nonce" is used to avoid... ??? todo
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

  // todo write test : null nonce fails
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

const fetchRequestFromDb = async (state) => {
  const requests = await db.getOidcRequest(state)

  const isRequestValid = requests.length === 1
  if (!isRequestValid) {
    // todo use propoer error codes ?
    throw new Error("Multiple oidcRequests found for the given state")
  }
  return requests[0]
}

module.exports.finishAuth = async (req) => {
  const client = await this.getClient()
  const params = client.callbackParams(req)
  console.log("params passed to callback", params)

  // todo : fetch code_verifier from DB. If no code_verifier, abort.
  let request
  try {
    request = await fetchRequestFromDb(params.state)
  } catch (e) {
    console.error("error when fetching oidc request from DB", e)
    return { error: "L'identification a échoué. Entrez votre email ci-dessous pour recommencer." }
  }
  console.log("found corresponding request", request)

  const tokenSet = await client.callback(
    config.HOSTNAME_WITH_PROTOCOL + urlCallback,
    params,
    {
      state: request.state,
      nonce: request.nonce
      // todo  code_verifier: req.session.code_verifier
    }
  )
  const claims = tokenSet.claims()
  console.log("claims decoded from tokenset", claims)
  const email = claims.preferred_username

  return {
    email,
    durationInMinutes: request.durationInMinutes,
    conferenceDay: request.conferenceDay,
    userTimezoneOffset: request.userTimezoneOffset
  }
}

