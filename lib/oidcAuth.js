/**
 * Usage :
 * const authRequest = authStart(email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
 *
 * If fail
 * authRequest == { error: "error message"}
 *
 * If success
 * authRequest == { redirectUrl : "<url>" }
 */
/**
 * TODO
 *  - rename sendValidationEmailController, that's not what it does any more
 *  - Rename routes and controllers where needed.
 *  - add new tests and move/fix the old ones
 */
const { generators, Issuer } = require("openid-client")
const config = require("../config.js")
const urls = require("../urls")
const db = require("../lib/db")
const format = require("../lib/format")

const urlCallback = urls.createConf

module.exports.getClient = async () => {
  console.log(config.OIDC_PROVIDER_URL, config.OIDC_CLIENT_ID, config.OIDC_CLIENT_SECRET)

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

module.exports.authStart = async (email, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset) => {
  const client = await this.getClient()

  /* todo : store the code_verifier in DB. We don't use it for now.
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  */

  // "state" will be sent back by the id server at the end of the flow. We use it to identify the auth request.
  // todo : is "state" the appropriate identifier for the whole request flow ?
  const state = generators.random()

  const redirectUrl = client.authorizationUrl({
      scope: "openid",
      state,
      /* todo add this back
      code_challenge,
      code_challenge_method: 'S256',
      */
      login_hint: email
  })

  console.log("state", state)

  try {
    await db.insertOidcRequest(state, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
    console.log(`OIDC request créé pour ${format.hashForLogs(email)}`)
  } catch(err) {
    console.log("Error when inserting authrequest token in DB", err)
    return { error: "Une erreur interne s'est produite, nous n'avons pas pu créer votre conférence." }
  }

  // todo : how to deal with expiration of request in oidc ?
  return { redirectUrl }
}

module.exports.getTokenFromRequest = async (req) => {
  const client = await this.getClient()
  const params = client.callbackParams(req)
  console.log("callbackParams", params)

  // todo : fetch code_verifier from DB. If no code_verifier, abort.

  const tokenSet = await client.callback(
    config.HOSTNAME_WITH_PROTOCOL + urlCallback,  
    params, 
    { 
      state: params.state,
      // todo  code_verifier: req.session.code_verifier
    }
  )
  console.log("tokenSet", tokenSet)
  // Todo : the email is already present in the Base64 encoded tokenSet.id_token. We could decode it instead of doing the
  // userInfo request. (why would it be better ? investigate.)
  const userInfo = await client.userinfo(tokenSet)
  console.log("userInfo", userInfo)

  const email = userInfo.preferred_username
  console.log("email", email)

  const state = params.state
  console.log("oidc token", state)
  try {
    const requests = await db.getOidcRequest(state)
    console.log("Oidcrequests fetched from DB", requests)

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

