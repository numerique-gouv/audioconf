exports.up = function (knex) {
  return knex.schema.createTable("phoneCalls", (table) => {
    table.text("id").primary() // will be OVH id + phoneNumber, to shuffle the data from old and new API
    table.text("phoneNumber").notNullable() // duplication but easier to use
    table.text("callId").notNullable() // duplication but easier to use
    table.datetime("dateBegin").notNullable()
    table.datetime("dateEnd").notNullable()
    table.integer("durationMinutes").notNullable()
    table.integer("countParticipants").notNullable()
    table.integer("countConnections").notNullable()
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable("phoneCalls")
}
