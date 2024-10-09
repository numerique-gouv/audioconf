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
const { getWhitelistedDomains } = require("./domains.js")

const urlCallback = urls.createConf

module.exports.getClient = async () => {
  const issuer = await Issuer.discover(config.OIDC_PROVIDER_URL)

  const client = new issuer.Client({
      client_id: config.OIDC_CLIENT_ID,
      client_secret: config.OIDC_CLIENT_SECRET,
      redirect_uris: [config.HOSTNAME_WITH_PROTOCOL + urlCallback],
      response_types: ["code"],
      id_token_signed_response_alg: config.OIDC_ID_TOKEN_SIGNED_ALG,
      userinfo_signed_response_alg: config.OIDC_USER_INFO_SIGNED_ALG,
      // token_endpoint_auth_method (default "client_secret_basic")
  })

  return client
}

module.exports.startAuth = async (conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset) => {
  const client = await this.getClient()

  /* todo : store the code_verifier in DB. We don't use it for now.
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  */

  // "state" will be sent back by the oidc server.
  // It is there to protect the end user from cross site request forgery(CSRF) attacks.
  // We also use it to identify the auth request at the end of the flow.
  const state = generators.random(128)
  // "nonce" is used to avoid to ID Token replay by third parties
  // The OIDC server will bind the ID Token with the client thanks to this nonce
  // We validate this nonce along the ID Token at the end of the flow.
  const nonce = generators.random(128)

  const redirectUrl = client.authorizationUrl({
      scope: "openid uid email",
      state,
      acr_values: config.OIDC_ACR_VALUES,
      /* todo add this back
      code_challenge,
      code_challenge_method: 'S256',
      */
      nonce,
      // login_hint: email
  })

  // todo write test : null nonce fails
  try {
    await db.insertOidcRequest(state, nonce, conferenceDurationInMinutes, conferenceDayString, userTimezoneOffset)
    console.log(`OIDC request créé pour state ${state}`)
  } catch(err) {
    console.log("Error when inserting authrequest token in DB", err)
    return { error: "Une erreur interne s'est produite, nous n'avons pas pu créer votre conférence." }
  }

  return { redirectUrl }
}

const fetchRequestFromDb = async (state) => {
  const requests = await db.getOidcRequest(state)

  const isRequestValid = requests.length === 1
  if (!isRequestValid) {
    throw new Error("Multiple oidcRequests found for the given state")
  }
  return requests[0]
}

module.exports.finishAuth = async (req) => {
  const client = await this.getClient()
  const params = client.callbackParams(req)

  // todo : fetch code_verifier from DB. If no code_verifier, abort.
  let request
  try {
    request = await fetchRequestFromDb(params.state)
  } catch (e) {
    console.error("error when fetching oidc request from DB", e)
    return { error: "L'identification a échoué. Entrez votre adresse mail ci-dessous pour recommencer." }
  }

  let tokenSet
  try {
    tokenSet = await client.callback(
      config.HOSTNAME_WITH_PROTOCOL + urlCallback,
      params,
      {
        state: request.state,
        nonce: request.nonce
        // todo  code_verifier: req.session.code_verifier
      }
    )
  } catch(error){
    console.error("error when requesting token from OIDC", error)
    return { error: "L'identification a échoué. Entrez votre adresse mail ci-dessous pour recommencer." }
  }

  let userinfo
  try {
    userinfo = await client.userinfo(tokenSet)
  } catch(error){
    console.error("error when requesting userinfo from OIDC", error)
    return { error: "L'identification a échoué. Entrez votre adresse mail ci-dessous pour recommencer." }
  }
  const email = userinfo.email
  
  try {
    const domain = format.extractEmailDomain(email)
    const whitelistedDomains = await getWhitelistedDomains()
    if(!whitelistedDomains.includes(domain)){
      throw new Error(`The domain ${domain} is not whitelisted.`)
    }
  } catch(e){
    console.error(`error when validating email ${email}`,e)
    return { error: `L'adresse e-mail ${email} n'est pas autorisée à utiliser ce service.` }
  }

  const user = {id_token: tokenSet.id_token, state: request.state}

  req.session.user = user
  
  return {
    email,
    durationInMinutes: request.durationInMinutes,
    conferenceDay: request.conferenceDay,
    userTimezoneOffset: request.userTimezoneOffset
  }
}

module.exports.getLogoutUrl = async({state, id_token_hint}) => {
  const client = await this.getClient()

  return client.endSessionUrl({id_token_hint,post_logout_redirect_uri: `${config.HOSTNAME_WITH_PROTOCOL}${urls.landing}`,state})
}
