
exports.up = function(knex) {
    return knex.schema
        .dropTable('conferences')
        .then(() =>{
            return knex.raw('CREATE EXTENSION "uuid-ossp";')
        })
        .then(() => {
            return knex.schema.createTable('conferences', (table) => {
                table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
                table.text('email').notNullable();
                table.text('phoneNumber').notNullable();
                table.text('durationInMinutes').notNullable();
                table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
                table.datetime('expiresAt').notNullable();
                table.datetime('canceledAt');
              });
        });
};

exports.down = function(knex) {
    return knex.schema
    .dropTable('conferences')
    .then(() => {
        return knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp";')
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
