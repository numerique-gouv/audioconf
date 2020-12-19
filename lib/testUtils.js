/**
 * Truncate all tables in a generic way.
 *
 * @param {*} knex knex client instance
 */
async function truncateAllTables(knex) {
    const tablesInfo = await knex("information_schema.tables")
        .select("table_name")
        .where("table_schema", "public")

    const tables = tablesInfo
        .map(info => info.table_name)
        .filter(table => !/knex_*/i.test(table))

    // The forEach doesn't seem to work (error in test)
    // tables.forEach(async (table) => {
    //     await knex(table).truncate()
    // })

    // The for loop seems to work...
    for (const table of tables) {
        await knex(table).truncate()
    }
}

/**
 *  Don't play destructive tests if TEST_MODE is not explicitly set.
 */
function checkAndThrowErrorIfNotInTestEnvironment() {
    const isStagingMode = process.env.TEST_MODE === "true"
    if (!isStagingMode) throw new Error("This test can't be run if the TEST_MODE variable is not set (for security reason because the used DB will be erased).")
}

async function reinitializeDB(knex) {
    try {
      // Need to truncate to ensure that no data will prevent a rollback (for constraint blocking issues)
      await truncateAllTables(knex)
      await knex.migrate.rollback({}, true)
      await knex.migrate.latest({})
    } catch (error) {
      console.error("Error in reinitializeDB", error)
    }

    console.log("Data are reinitialized")
  }


module.exports = {
    truncateAllTables,
    checkAndThrowErrorIfNotInTestEnvironment,
    reinitializeDB
}

