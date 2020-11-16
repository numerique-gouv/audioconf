exports.up = knex => {
  return knex.schema
    .alterTable('loginTokens', (table) => {
      table.string('durationInMinutes').nullable().alter()
    })
}

exports.down = knex => {
  return knex.schema
    .alterTable('imloginTokensages', table => {
      table.string('durationInMinutes').notNullable().alter()
    })
}
