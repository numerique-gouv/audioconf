/* global afterEach describe beforeEach it */
const chai = require("chai")
const conferences = require("../lib/conferences")
const knex = require("../knex-client")
const sinon = require("sinon")
const utils = require("./utils")

const fetchCallsStats = require("../jobs/fetchCallsStats")

describe("fetchCallsStats", () => {
  const phoneNumber = "0033122334455"
  const callId1 = "12345" // todo string or number ?
  const callId2 = "78901"
  let getPhoneNumbersStub, getCallsStub, getHistoryForCallStub

  beforeEach(async () => {
    getPhoneNumbersStub = sinon.stub(conferences, "getAllPhoneNumbers").returns(Promise.resolve([phoneNumber]))
    getCallsStub = sinon.stub(conferences, "getCallsForPhoneNumber").returns(Promise.resolve([callId1, callId2]))

    getHistoryForCallStub = sinon.stub(conferences, "getHistoryForCall")
    getHistoryForCallStub.withArgs(phoneNumber, callId1).returns({
      id: callId1,
      dateBegin: "2021-06-21T15:23:32.839Z",
      dateEnd: "2021-06-21T15:33:32.839Z",
      countParticipants: 2,
      countConnections: 2,
      duration : 8888,
    })
    getHistoryForCallStub.withArgs(phoneNumber, callId2).returns({
      id: callId2,
      dateBegin: "2021-06-20T17:36:32.839Z",
      dateEnd: "2021-06-20T18:36:32.839Z",
      countParticipants: 4,
      countConnections: 5,
      duration : 777,
    })
  })

  afterEach(async () => {
    await getPhoneNumbersStub.restore()
    await getCallsStub.restore()
    await getHistoryForCallStub.restore()
    await utils.reinitializeDB()
  })

  it("should fetch call stats", async () => {
    const summary = await fetchCallsStats()

    chai.assert.equal(summary.phoneNumbersLength, 1)
    chai.assert.equal(summary.insertedRows, 2)

    // OVH services were called
    sinon.assert.calledOnce(getPhoneNumbersStub)
    sinon.assert.calledOnce(getCallsStub)
    sinon.assert.calledTwice(getHistoryForCallStub)

    // results are saved in DB
    const savedCalls = await knex("phoneCalls")
      .select("*")
      .where("phoneNumber", phoneNumber)
      .orderBy("dateBegin", "desc")

    chai.assert.lengthOf(savedCalls, 2)
    chai.assert.include(savedCalls[0].id, callId1, "id of saved history contains callId")
    chai.assert.include(savedCalls[1].id, callId2, "id of saved history contains callId")
    chai.assert.include(savedCalls[0].id, phoneNumber, "id of saved history contains phoneNumber")
    chai.assert.include(savedCalls[1].id, phoneNumber, "id of saved history contains phoneNumber")
  })
})