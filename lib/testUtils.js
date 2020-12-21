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
    await knex.raw("drop schema public cascade")
    await knex.raw("create schema public")
}

/**
 * Truncate all tables in a generic way.
 *
 * @param {*} knex knex client instance
 */
async function truncateAllTables(knex) {
  const tablesInfo = await knex("information_schema.tables")
    .select("table_name")
    .where("table_schema", "public")

  // Preserve the tables used internally by Knex.
  const tables = tablesInfo
    .map(info => info.table_name)
    .filter(table => !/knex_*/i.test(table))

  for (const table of tables) {
    // disable constraints (included PK and FK)
    await knex.raw(`alter table "${table}" disable trigger all`)
  }
  for (const table of tables) {
    await knex.raw(`truncate "${table}" restart identity cascade`)
  }
  for (const table of tables) {
    // reenable constraints
    await knex.raw(`alter table "${table}" enable trigger all`)
  }
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

/**
 * Insert a bunch of conferences.
 *
 * @param {*} knex knex instance
 * @param {*} conferences  array of conferences
 */
async function insertConferences(conferences = [], knex) {
  if (!knex) throw new Error("A knex client must be provided")
  for (const conference of conferences) {
    await knex("conferences").insert(conference)
  }
}

/**
 * Insert a bunch of users.
 *
 * @param {*} knex knex instance
 * @param {*} conferences  array of users
 */
async function insertUsers(users = [], knex) {
  if (!knex) throw new Error("A knex client must be provided")
  for (const user of users) {
    await knex("users").insert(user)
  }
}

module.exports = {
    checkAndThrowErrorIfNotInTestEnvironment,
    reinitializeDB,
    truncateAllTables,
    insertConferences,
    insertUsers
}

