exports.up = function (knex) {
  return knex.schema.table('stats', function (table) {
    table.integer('freePhoneNumbersCount').notNullable().defaultTo(-1)
  })
}

exports.down = function (knex) {
  return knex.schema.table('stats', function (table) {
      table.dropColumn('freePhoneNumbersCount')
  })
}
