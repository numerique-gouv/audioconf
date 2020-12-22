const config = require("./config")

console.log("config.DATABASE_URL", config.DATABASE_URL)

module.exports = {
  client: "pg",
  connection: config.DATABASE_URL,
  acquireConnectionTimeout: 10000,
  migrations: {
    tableName: "knex_migrations"
  }
}
