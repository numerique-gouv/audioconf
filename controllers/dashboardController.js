
const jwt = require("jsonwebtoken")

const config = require("../config")
const conferences = require("../lib/conferences")
const { decrypt } = require("../lib/crypto")

module.exports.get = async (req, res) => {
    res.render("dashboard", {
        participants: [],
        phoneNumber: config.OVH_ROOM_PHONE_NUMBER,
        roomNumber: undefined,
        lastUpdate: new Date()
    })
}

module.exports.getParticipants = async (req, res) => {
    const token = req.body.token

    try {
        if (!token) {
            throw new Error("Token manquant")
        }
        const roomNumber = jwt.verify(decrypt(token), config.SECRET).roomNumber
        const participantIds = await conferences.getParticipants(config.OVH_ROOM_PHONE_NUMBER, roomNumber)
        const participants = await Promise.all(participantIds.map(id => conferences.getParticipant(config.OVH_ROOM_PHONE_NUMBER, roomNumber, id)))
        return res.json({
            participants: participants.map(participant => {
                const arrivalDateTime = participant.arrivalDateTime
                const date = new Date(arrivalDateTime)
                return {
                    ...participant,
                    arrivalTime: date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                    callerNumber: participant.callerNumber.slice(0, 4) + "XXXX" + participant.callerNumber.slice(-4)
                }
            }),
            phoneNumber: config.OVH_ROOM_PHONE_NUMBER,
            roomNumber,
            lastUpdate: new Date()
        })
    } catch (err) {
        console.log(`Impossible de récuperer la room : ${err}`)
        res.status(401).send({ error: "Identification de la salle de conférence impossible" })
    }
}

module.exports.participantAction = async (req, res) => {
    const token = req.body.token
    const participantId = parseInt(req.params.participantId, 10)
    const action = req.params.action

    if (!token) {
        res.redirect("/")
    }

    try {
        const roomNumber = jwt.verify(decrypt(token), config.SECRET).roomNumber
        await conferences.participantAction(config.OVH_ROOM_PHONE_NUMBER, roomNumber, participantId, action)
        req.flash("info", `Action ${action} bien prise en compte`)
    } catch (err) {
        console.log(`Impossible d'effectuer l'action ${action} : ${err}`)
        req.flash(`Impossible d'effectuer l'action ${action}`)
        res.redirect(`/dashboard#${token}`)
    }
    setTimeout(() => { // wait for mute property to be updated
        res.redirect(`/dashboard#${token}`)
    }, 1000)
}
