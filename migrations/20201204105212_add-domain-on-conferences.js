exports.up = function (knex) {
  return knex.schema.table("conferences", function (table) {
    table.text("domain")
  })
}

exports.down = function (knex) {
  return knex.schema.table("conferences", function (table) {
    table.dropColumn("domain")
  })
}
