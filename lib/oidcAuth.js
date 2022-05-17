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