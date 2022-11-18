const chai = require("chai")

const anonymizeJob = require("../jobs/anonymizeConferences")
const utils = require("./utils")

// global describe beforeEach it

describe("Tests on anonymize conference job", () => {

    beforeEach(async () => {
        await utils.reinitializeDB()
    })

    it("should update some emails jobDB", async function () {

        const conferences = [
            {
                "id": "53358df7-96c2-40b8-8c1b-7f7c03605538",
                "email": "jean-marc.dupont@gouv.fr",
                "expiresAt": "2020-12-14 22:59:59.000000",
                "phoneNumber": "",
            },
            {
                "id": "649af661-7f3f-4e78-bce1-faf19b6722c4",
                "email": "jean-marc.dupont@beta.gouv.fr",
                "expiresAt": "2020-12-13 22:59:59.000000",
                "phoneNumber": "",
            },
            // This one will not be anonymized.
            {
                "id": "d4bc5446-4e50-43dd-a1ba-cb43681e6b70",
                "email": "olivier.martin@dgfip.finances.gouv.fr",
                "phoneNumber": "",
                "expiresAt": new Date().toISOString(),
            }
        ]

        await utils.insertConferences(conferences)

        const updatedConferences = await anonymizeJob()

        chai.assert.equal(updatedConferences.length, 2)
        chai.assert.equal(updatedConferences.filter(elt => elt.domain === "beta.gouv.fr").length, 1)
        chai.assert.equal(updatedConferences.filter(elt => elt.domain === "gouv.fr").length, 1)

    })

    it("should update no emails", async function () {

        const conferences = [
            {
                "id": "649af661-7f3f-4e78-bce1-faf19b6722c4",
                "email": "jean-marc.dupont@beta.gouv.fr",
                "expiresAt": new Date().toISOString(),
                "phoneNumber": "",
            },
            // This one will not be anonymized.
            {
                "id": "d4bc5446-4e50-43dd-a1ba-cb43681e6b70",
                "email": "olivier.martin@dgfip.finances.gouv.fr",
                "phoneNumber": "",
                "expiresAt": new Date().toISOString(),
            }
        ]

        utils.insertConferences(conferences)

        const updatedConferences = await anonymizeJob()

        chai.assert.equal(updatedConferences.length, 0)
    })
})
