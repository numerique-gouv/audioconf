
exports.up = function(knex) {
  return knex.schema.createTable("lastSuccessfullySavedPhoneCall", (table) => {
    table.text("phoneNumber").primary() // Primary because only one lastCall saved per phoneNumber
    table.text("id") // corresponding to id of object in phoneCall table
    table.datetime("dateBegin").notNullable() // duplication but easier to use
    table.timestamp("updatedAt")
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable("lastSuccessfullySavedPhoneCall")
}
