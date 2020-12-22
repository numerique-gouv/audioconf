const config = require("./config")

module.exports = {
  client: "pg",
  connection: config.DATABASE_URL,
  acquireConnectionTimeout: 10000,
  migrations: {
    tableName: "knex_migrations"
  }
}
