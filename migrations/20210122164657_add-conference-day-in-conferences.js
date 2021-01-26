exports.up = function (knex) {
  return knex.schema.table("conferences", function (table) {
    table.date("conferenceDay")
  })
}

exports.down = function (knex) {
  return knex.schema.table("conferences", function (table) {
    table.dropColumn("conferenceDay")
  })
}
