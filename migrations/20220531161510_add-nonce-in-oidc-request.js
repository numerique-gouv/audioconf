exports.up = function (knex) {
  // Add the column, with a default value, so that existing rows will fill the new column with the default value.
  function addColumnWithDefaultValue() {
    return knex.schema.table("oidcRequest", (table) => {
      table.text("nonce").notNullable().defaultTo(-1)
    })
  }

  // Remove defaultValue for future rows (this will force an explicit value to be set when creating a row)
  function removeDefaultValue() {
    return knex.schema.alterTable("oidcRequest", (table) => {
      table.text("nonce").notNullable().alter()
    })
  }

  return addColumnWithDefaultValue().then(removeDefaultValue)
}

exports.down = function(knex) {
  return knex.schema.table("oidcRequest", function (table) {
    table.dropColumn("nonce")
  })
}
