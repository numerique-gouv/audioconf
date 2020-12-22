const config = require("../config")

const { parse } = require("pg-connection-string")
const chai = require("chai")
const chaiHttp = require("chai-http")

chai.use(chaiHttp)
chai.should()

const utils = require("./utils")

if (config.DATABASE_URL) {
  const dbParts = parse(config.DATABASE_URL)
  const testDbName = `${dbParts.database}__test`
  console.log(`Overriding DATABASE_URL for test with database : ${testDbName}`)
  config.DATABASE_URL =  utils.getConnectionStringForDB({ ...dbParts, database: testDbName})
  console.log("DB_URL", config.DATABASE_URL)
} else {
  console.log("Environment variable DATABASE_URL not found")
}

console.log("Done test setup")
