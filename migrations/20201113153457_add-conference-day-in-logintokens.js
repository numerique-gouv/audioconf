exports.up = function (knex) {
  return knex.schema.table("loginTokens", function (table) {
    table.date("conferenceDay")
  })
}

exports.down = function (knex) {
  return knex.schema.table("loginTokens", function (table) {
    table.dropColumn("conferenceDay")
  })
}
