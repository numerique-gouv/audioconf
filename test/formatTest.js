const chai = require('chai')
const format = require('../lib/format')

describe('format', function() {
  it('should display times in default server timezone', function(done) {
    const date = new Date('2020-12-04 18:37:00')
    const formattedDateTime = format.formatFrenchDateTime(date)
    console.log(formattedDateTime)
    chai.assert.include(formattedDateTime, '18:37', 'has the right time')
    done()
  })
})