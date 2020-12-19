require("dotenv").config()

const env = process.env.TEST_MODE === "true" ? "staging": "production"

const config = {
  production : {
    client: "pg",
    connection: process.env.DATABASE_URL,
    acquireConnectionTimeout: 10000,
    migrations: {
      tableName: "knex_migrations",
    },
  },
  staging: {
    client: "pg",
    connection: process.env.TEST_DB_URL,
    acquireConnectionTimeout: 10000,
    migrations: {
      tableName: "knex_migrations",
    },
  }
}

module.exports = require("knex")(config[env])
