exports.up = function (knex) {
  return knex.schema.alterTable("conferences", function (table) {
    table.text("domain")
    table.text("email").nullable().alter()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable("conferences", function (table) {
    table.dropColumn("domain")
    table.text("email").notNullable().alter()
  })
}
