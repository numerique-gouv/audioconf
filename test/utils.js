const { parse } = require("pg-connection-string")

const config = require("../config")
const { Client } = require("pg")
const knex = require("../knexfile")

function getClientDefaultDB(url) {
    const { user, password, host, port, database: testDbName } = parse(url)

    if (!testDbName) return new Error("DATABASE_URL environment variable not set")

    // Postgres needs to have a connection to an existing database in order
    // to perform any request. Since our test database doesn't exist yet,
    // we need to connect to the default database to create it.
    const connectionString = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${encodeURIComponent(host)}:${encodeURIComponent(port)}/postgres`

    return {
        testDbName,
        client: new Client({ connectionString })
    }
}

function setupTestDatabase() {
    const { testDbName, client } = getClientDefaultDB(config.DATABASE_URL)

    console.log(`Test database ${testDbName} is going to be created ...`)

    return client.connect()
        .then(() => client.query(`DROP DATABASE IF EXISTS ${testDbName}`, []))
        .then(() => console.log(`drop database OK`))
        .then(() => client.query(`CREATE DATABASE ${testDbName}`, []))
        .then(() => console.log(`Test database ${testDbName} created successfully 🚀`))
        .then(() => client.end())
        .then(() => knex.migrate.latest())
        .then(() => console.log(`Knex migration is successful 🚀`))
        .catch((error) => console.error("Error in setupTestDatabase", error))
}

function cleanUpTestDatabase() {
    const { testDbName, client } = getClientDefaultDB(config.DATABASE_URL)

    return knex.destroy()
        .then(() => client.connect())
        .then(() => client.query(`DROP DATABASE ${testDbName}`, []))
        .then(() => client.end())
        .then(() => console.log(`Test database ${testDbName} cleaned up successfully`))
        .catch((error) => console.error("Erreur dans cleanupTestDatabase", error))
}

module.exports = {
    setupTestDatabase,
    cleanUpTestDatabase
}
