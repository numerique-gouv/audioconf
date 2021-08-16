
const jwt = require("jsonwebtoken")

const config = require("../config")
const conferences = require("../lib/conferences")
const { decrypt } = require("../lib/crypto")

module.exports.get = async (req, res) => {
    const token = req.params.token

    if (!token) {
        res.redirect('/')
    }

    try {
        const roomNumber = jwt.verify(decrypt(token), config.SECRET).roomNumber
        const participantIds = await conferences.getParticipants(config.OVH_ROOM_PHONE_NUMBER, roomNumber)
        const participants = await Promise.all(participantIds.map(id => conferences.getParticipant(config.OVH_ROOM_PHONE_NUMBER, roomNumber, id)))
        return res.render("dashboard", {
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
            token,
            lastUpdate: new Date()
        })
    } catch (err) {
        console.log(`Impossible de recuperer la room : ${err}`)
        req.flash(`Ce lien n'est plus valide : ${err}`)
        res.redirect('/')
    }
}

module.exports.participantAction = async (req, res) => {
    const token = req.params.token
    const participantId = parseInt(req.params.participantId, 10)
    const action = req.params.action

    if (!token) {
        res.redirect('/')
    }

    try {
        const roomNumber = jwt.verify(decrypt(token), config.SECRET).roomNumber
        await conferences.participantAction(config.OVH_ROOM_PHONE_NUMBER, roomNumber, participantId, action)
        req.flash("info", `Action ${action} bien prise en compte`)
    } catch (err) {
        console.log(`Impossible d'effectuer l'action ${action} : ${err}`)
        req.flash(`Impossible d'effectuer l'action ${action} : ${err}`)
        res.redirect(`/dashboard/${token}`)
    }
    setTimeout(() => { // wait for mute property to be updated
        res.redirect(`/dashboard/${token}`)
    }, 1000)
}
