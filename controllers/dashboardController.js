
const jwt = require("jsonwebtoken")

const config = require("../config")
const conferences = require("../lib/conferences")
const { decrypt } = require("../lib/crypto")
const { formatLocalTime, formatFrenchPhoneNumber, formatPin } = require("../lib/format")

module.exports.getDashboard = async (req, res) => {
    res.render("dashboard")
}

module.exports.fetchDashboardInfo = async (req, res) => {
    const roomNumberHash = req.body.roomNumberHash

    try {
        if (!roomNumberHash) {
            throw new Error("Le roomNumberHash n'est pas présent")
        }
        const roomNumber = jwt.verify(decrypt(roomNumberHash), config.SECRET).roomNumber
        const participantIds = await conferences.fetchDashboardInfo(config.OVH_ROOM_PHONE_NUMBER, roomNumber)
        const participants = await Promise.all(participantIds.map(id => conferences.getParticipant(config.OVH_ROOM_PHONE_NUMBER, roomNumber, id)))
        return res.json({
            participants: participants.map(participant => {
                const arrivalDateTime = participant.arrivalDateTime
                const date = new Date(arrivalDateTime)
                return {
                    ...participant,
                    arrivalTime: formatLocalTime(date),
                    callerNumber: participant.callerNumber.slice(0, 4) + "XXXX" + participant.callerNumber.slice(-4)
                }
            }),
            phoneNumber: formatFrenchPhoneNumber(config.OVH_ROOM_PHONE_NUMBER),
            roomNumber: formatPin(roomNumber),
            lastUpdate: new Date()
        })
    } catch (err) {
        console.error(`Impossible de récuperer la room : ${err}`)
        res.status(401).send({ error: "La conférence ne contient aucun participant ou n'existe pas. Vous pouvez recréer une conférence." })
    }
}

module.exports.participantAction = async (req, res) => {
    const roomNumberHash = req.body.roomNumberHash
    const participantId = parseInt(req.params.participantId, 10)
    const action = req.params.action

    try {
        if (!roomNumberHash) {
            throw new Error("Le roomNumberHash n'est pas présent")
        }   
        if (!["mute", "unmute"].includes(action)) {
            throw new Error("L'action n'est pas autorisée")
        } 
        const roomNumber = jwt.verify(decrypt(roomNumberHash), config.SECRET).roomNumber
        await conferences.participantAction(config.OVH_ROOM_PHONE_NUMBER, roomNumber, participantId, action)
        req.flash("info", `Action ${action} bien prise en compte`)
    } catch (err) {
        console.error(`Impossible d'effectuer l'action ${action} : ${err}`)
        res.status(401).send({ error: "L'action n'a pas fonctionné" })
    }
}
