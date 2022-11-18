exports.up = function (knex) {
    return knex.schema.table("loginTokens", function (table) {
        table.integer("durationInMinutes").defaultTo(720)
    })
}
  
exports.down = function (knex) {
    return knex.schema.table("loginTokens", function (table) {
        table.dropColumn("durationInMinutes")
    })
}
  