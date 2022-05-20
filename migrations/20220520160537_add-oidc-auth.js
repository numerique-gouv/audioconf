
exports.up = function(knex) {
  return knex.schema
    .createTable("oidcRequest", (table) => {
      table.text("state").primary()
      table.datetime("createdAt").notNullable().defaultTo(knex.fn.now())
      table.integer("userTimezoneOffset").defaultTo(-60)
      table.integer("durationInMinutes")
      table.date("conferenceDay")
      // todo : add code_verifier
    })
}

exports.down = function(knex) {
  return knex.schema
    .dropTable("oidcRequest")
}
