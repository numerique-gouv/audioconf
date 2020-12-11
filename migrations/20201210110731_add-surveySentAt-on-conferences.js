exports.up = function (knex) {
  return knex.schema
    .alterTable("conferences", (table) => {
      table.text("hashedEmail")
    })
    .then(() =>
      knex.schema.createTable("users", (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.datetime("surveySentAt")
        table.text("hashedEmail")
      })
    )
}

exports.down = function (knex) {
  return knex.schema
    .alterTable("conferences", (table) => {
      table.dropColumn("hashedEmail")
    })
    .then(() => knex.schema.dropTable("users"))
}
