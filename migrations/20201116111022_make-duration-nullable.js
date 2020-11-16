exports.up = knex => {
  return knex.schema
    .alterTable('loginTokens', (table) => {
      table.string('durationInMinutes').nullable().alter()
    }).then(() => {
      return knex.schema
        .alterTable('conferences', (table) => {
          table.string('durationInMinutes').nullable().alter()
        })
    })
}

// Note : if the column contains null values, the rollback with fail :
// you cannot set notNullable when there are null values.
exports.down = knex => {
  return knex.schema
    .alterTable('loginTokens', table => {
      table.string('durationInMinutes').notNullable().alter()
    }).then(() => {
      return knex.schema
        .alterTable('conferences', table => {
          table.string('durationInMinutes').notNullable().alter()
        })
    })
}
