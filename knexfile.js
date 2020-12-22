const config = require("./config")

const knexConfig = {
  client: "pg",
  connection: config.DATABASE_URL,
  acquireConnectionTimeout: 10000,
  migrations: {
    tableName: "knex_migrations"
  }
}

module.exports = require("knex")(knexConfig)
