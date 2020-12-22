const utils = require("./utils")

/* global after before */

before(() => utils.setupTestDatabase())

after(() => utils.cleanUpTestDatabase())
