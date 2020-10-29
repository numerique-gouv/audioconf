
exports.up = function(knex) {
  return knex.schema
    .createTable('phoneNumbers', (table) => {
      table.text('phoneNumber').primary();
      table.datetime('freeAt').notNullable().defaultTo(knex.fn.now());
      table.integer('used').notNullable().defaultTo(0);
    })
    .then(() => {
      return knex.schema.createTable('conferences', (table) => {
        table.increments().primary();
        table.text('email').notNullable();
        table.text('phoneNumber').notNullable();
        table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
        table.datetime('expiredAt').notNullable();
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('phoneNumbers')
    .then(() => {
      return knex.schema.dropTable('conferences');
    });
};
