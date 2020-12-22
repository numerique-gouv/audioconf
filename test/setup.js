const config = require("../config")

const { parse } = require("pg-connection-string")
const chai = require("chai")
const chaiHttp = require("chai-http")

chai.use(chaiHttp)
chai.should()

console.log("Done test setup")

if (config.DATABASE_URL) {
  const dbParts = parse(config.DATABASE_URL)
  const testDbName = `${dbParts.database}__test`
  console.log(`Overriding DATABASE_URL for test with database : ${testDbName}`)
  config.DATABASE_URL = `postgres://${encodeURIComponent(dbParts.user)}:${encodeURIComponent(dbParts.password)}@${encodeURIComponent(dbParts.host)}:${encodeURIComponent(dbParts.port)}/${encodeURIComponent(testDbName)}`
} else {
  console.log("Environment variable DATABASE_URL not found")
}
