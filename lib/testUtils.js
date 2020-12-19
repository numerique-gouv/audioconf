/**
 *  Don't play destructive tests if TEST_MODE is not explicitly set.
 */
function checkAndThrowErrorIfNotInTestEnvironment() {
    const isStagingMode = process.env.TEST_MODE === "true"
    if (!isStagingMode) throw new Error("This test can't be run if the TEST_MODE variable is not set (for security reason because the used DB will be erased).")
}

/**
 * Recreate the public schema.
 * @param {*} knex knex client instance
 */
async function recreatePublicSchema(knex) {
    return await knex.raw("drop schema public cascade")
        .then(() => knex.raw("create schema public"))
}

/**
 * Reinitialize db for testing purpose.
 * @param {*} knex
 */
async function reinitializeDB(knex) {
    try {
      await recreatePublicSchema(knex)
      await knex.migrate.latest({})
    } catch (error) {
      console.error("Error in reinitializeDB", error)
    }

    console.log("Data are reinitialized")
  }

module.exports = {
    checkAndThrowErrorIfNotInTestEnvironment,
    reinitializeDB
}

