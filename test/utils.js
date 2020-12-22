const { parse } = require("pg-connection-string")

const config = require("../config")
const { Client } = require("pg")
const knex = require("../knex-client")

const getConnectionStringForDB = ({ user, password, host, port, database }) => `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${encodeURIComponent(host)}:${encodeURIComponent(port)}/${database}`

function getClientDefaultDB(url) {
    const { user, password, host, port, database } = parse(url)

    if (!database) return new Error("DATABASE_URL environment variable not set")

    // Postgres needs to have a connection to an existing database in order to perform any request.
    // Since our test database doesn't exist yet, we need to connect to the default database to create it.
    const connectionString = getConnectionStringForDB({user, password, host, port, database: "postgres"})

    return {
        database,
        client: new Client({ connectionString })
    }
}

function setupTestDatabase() {
    const { database: testDbName, client } = getClientDefaultDB(config.DATABASE_URL)

    console.log(`Test database ${testDbName} is going to be created ...`)

    return client.connect()
        .then(() => client.query(`DROP DATABASE IF EXISTS ${testDbName}`, []))
        .then(() => client.query(`CREATE DATABASE ${testDbName}`, []))
        .then(() => console.log(`Test database ${testDbName} created successfully 🚀`))
        .then(() => client.end())
        .then(() => knex.migrate.latest())
        .then(() => console.log(`Knex migration is successful 🚀`))
        .catch((error) => console.error("Error in setupTestDatabase", error))
}

function cleanUpTestDatabase() {
    const { database: testDbName, client } = getClientDefaultDB(config.DATABASE_URL)

    console.log(`Test database ${testDbName} is going to be deleted ...`)

    return knex.destroy()
        .then(() => client.connect())
        .then(() => client.query(`DROP DATABASE IF EXISTS ${testDbName}`, []))
        .then(() => client.end())
        .then(() => console.log(`Test database ${testDbName} cleaned up successfully 🚀`))
        .catch((error) => console.error("Erreur dans cleanupTestDatabase", error))
}

async function recreatePublicSchema() {
    await knex.raw("drop schema public cascade")
    await knex.raw("create schema public")
}

async function reinitializeDB() {
    try {
        await recreatePublicSchema()
        await knex.migrate.latest({})
    } catch (error) {
        console.error("Error in reinitializeDB", error)
    }

    console.log("Data are reinitialized")
}

module.exports = {
    getConnectionStringForDB,
    setupTestDatabase,
    cleanUpTestDatabase,
    reinitializeDB
}
