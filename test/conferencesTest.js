const chai = require('chai')
const conferences = require('../lib/conferences')

describe('conferences', function() {
  it('should compute the Date of end of conference in local time, for GMT+X', async function() {
    const dayString = '2020-02-04'
    const userTimezoneOffset = -240 // GMT+4, Réunion
    const expirationDate = conferences.computeConfExpirationDate(dayString, userTimezoneOffset)
    console.log(expirationDate.toISOString())
    const GMTRepresentationOfExpirationDate = expirationDate.toISOString()

    chai.assert.include(GMTRepresentationOfExpirationDate, dayString, 'conf is on the right day')
    chai.assert.include(GMTRepresentationOfExpirationDate, '19:59:59', 'conf is at 23:59:59 local time')

  })

  it('should compute the Date of end of conference in local time, for GMT-X', async function() {
    const dayString = '2020-02-04'
    const userTimezoneOffset = 180 // GMT-3, Guyane
    const expirationDate = conferences.computeConfExpirationDate(dayString, userTimezoneOffset)
    console.log(expirationDate.toISOString())
    const GMTRepresentationOfExpirationDate = expirationDate.toISOString()

    // In GMT, the expiration is on the next day
    chai.assert.include(GMTRepresentationOfExpirationDate, '2020-02-05', 'conf is on the next day')
    chai.assert.include(GMTRepresentationOfExpirationDate, '02:59:59', 'conf is at 23:59:59 local time')

  })
})