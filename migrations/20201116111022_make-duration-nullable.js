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

// Note : we cannot set the fields back to notNullable, because now that the column contains null values,
// the rollback will crash.
exports.down = knex => {
}
