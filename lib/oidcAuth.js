/**
 * Usage :
 * const authRequest = authStart(email)
 *
 * If fail
 * authRequest == { error: "error message"}
 *
 * If success
 * authRequest == { token : "<token>", tokenExpirationDate: "<tokenExpirationDate>" }
 */

/**
 * todo :
 *  Authorization flow :
 *   - start from https://github.com/tchapgouv/oidc-client-example/blob/9e63dba77dbcbe00a999a83c5ee6a4034d6c9157/src/routes.ts#L35
 *   - but also generate the state by hand with generators.random([bytes]), and pass it in the params for client.authorizationUrl
 *
 * authStart(email) should return { token : "<state>", tokenExpirationDate: "<compute it, see magicAuthLink>"
 */

/**
 * TODO
 *  - rename sendValidationEmailController, that's not what it does any more
 *  - implement the rest of OIDC flow : client.callback (client.userInfo is not used, don't implement it). Pass the resulting `token: "<state>"` back to the createConfController.createConf, which will use it to fetch from db.
 *  - refactor where needed so that both auth modules implement the same interface, and all auth code is in the auth modules. Rename routes and controllers where needed.
 *  - add new tests and move/fix the old ones
 */
const { generators, Issuer } = require("openid-client")
const config = require("../config.js")
const urls = require("../urls")

const urlCallback = urls.createConf

const getClient = async () => {
  console.log(config.OIDC_PROVIDER_URL, config.OIDC_CLIENT_ID, config.OIDC_CLIENT_SECRET)

  const issuer = await Issuer.discover(config.OIDC_PROVIDER_URL)
//  console.log("Discovered issuer", issuer.issuer)
//  console.log("Discovered metadata", issuer.metadata)
 
  const client = new issuer.Client({
      client_id: config.OIDC_CLIENT_ID,
      client_secret: config.OIDC_CLIENT_SECRET,
      redirect_uris: [config.HOSTNAME_WITH_PROTOCOL + urlCallback],
      response_types: ["code"],
         // id_token_signed_response_alg (default "RS256")
         // token_endpoint_auth_method (default "client_secret_basic")
  }) // => Client
 
  return client
}

module.exports.authStart = async (email) => {
  const client = await getClient()

  /* todo : store the code_verifier in DB. We don't use it for now.
  const code_verifier = generators.codeVerifier();
  // store the code_verifier in your framework's session mechanism, if it is a cookie based solution
  // it should be httpOnly (not readable by javascript) and encrypted.
  req.session.code_verifier = code_verifier;
  req.session.save()
  const code_challenge = generators.codeChallenge(code_verifier);
  */

  // "state" will be sent back by the id server at the end of the flow. We use it to identify the auth request.
  const state = generators.random()
  const requestExpirationDate = new Date()
  requestExpirationDate.setMinutes(requestExpirationDate.getMinutes() + config.TOKEN_DURATION_IN_MINUTES)

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

  return {
    token: state,
    tokenExpirationDate: requestExpirationDate,
    redirectUrl: redirectUrl,
  }
}

module.exports.getTokenFromRequest = async (req) => {
  const client = await getClient()
  const params = client.callbackParams(req)
  console.log("callbackParams", params)

  // todo // if (!params || !req.session.code_verifier) return res.redirect('/');

  const tokenSet = await client.callback(
    config.HOSTNAME_WITH_PROTOCOL + urlCallback, 
    params, 
// todo   { code_verifier: req.session.code_verifier }
  )
  console.log("tokenSet", tokenSet)

  // todo     req.session.code_verifier = undefined;
  
  const state = tokenSet.state // maybe ??
  console.log("oidc token", state)
  return state
}
