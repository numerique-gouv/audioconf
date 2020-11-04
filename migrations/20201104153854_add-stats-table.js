
exports.up = function(knex) {
  return knex.schema
    .createTable('stats', (table) => {
      table.datetime('date').notNullable().defaultTo(knex.fn.now()).primary()
      table.integer('onlineParticipantsCount').notNullable()
      table.integer('activeConfsCount').notNullable()
      table.integer('errorConfsCount').notNullable()
    })
}

exports.down = function(knex) {
  return knex.schema
    .dropTable('stats')
};
