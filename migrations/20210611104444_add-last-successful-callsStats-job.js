
exports.up = function(knex) {
  return knex.schema.createTable("lastSuccessfulCallStatsJob", (table) => {
    // For each fetchCallsStats job that ended successfully, we save the latest phoneCall saved.
    // The next fetchCallsStats job will start from there.
    table.text("phoneNumber").primary() // Primary because only one lastCall saved per phoneNumber
    table.text("id") // corresponding to id of object in phoneCall table
    table.datetime("dateBegin").notNullable() // duplication but easier to use
    table.timestamp("updatedAt")
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable("lastSuccessfulCallStatsJob")
}
