const chai = require("chai")
const format = require("../lib/format")

describe("format", function() {
  it("should display times in default server timezone", function(done) {
    const date = new Date("2020-12-04 18:37:00")

    const formattedDateTime = format.formatFrenchDateTime(date)

    // Formatted version should display same time as the one that was input, because default timezone is server timezone
    chai.assert.include(formattedDateTime, "18:37", "has the right time")
    done()
  })
})
