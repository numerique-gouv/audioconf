
exports.up = function (knex) {
  return knex.schema.createTable("surveyMarks", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.decimal("average", 3, 2).notNullable()
    table.integer("count").notNullable()
    table.text("survey_date").notNullable().unique() // Format: YYYY-MM-DD
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable("surveyMarks")
}
