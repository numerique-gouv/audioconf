
const jwt = require("jsonwebtoken")

const config = require("../config")
const conferences = require("../lib/conferences")

module.exports.get = async (req, res) => {
    const token = req.params.token

    if (!token) {
        res.redirect("/")
    }

    try {
        const pin = jwt.verify(token, config.SECRET).pin
        const participantIds = await conferences.getParticipants(config.OVH_ROOM_PHONE_NUMBER, pin)
        const participants = await Promise.all(participantIds.map(id => conferences.getParticipant(config.OVH_ROOM_PHONE_NUMBER, pin, id)))
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
            pin,
            token,
            lastUpdate: new Date()
        })
    } catch (err) {
        console.log(`Impossible de recuperer la room : ${err}`)
        req.flash(`Ce lien n'est plus valide : ${err}`)
        res.redirect("/")
    }
}

module.exports.participantAction = async (req, res) => {
    const token = req.params.token
    const participantId = parseInt(req.params.participantId, 10)
    const action = req.params.action

    if (!token) {
        res.redirect("/")
    }

    try {
        const pin = jwt.verify(token, config.SECRET).pin
        await conferences.participantAction(config.OVH_ROOM_PHONE_NUMBER, pin, participantId, action)
        req.flash("info", `Action ${action} bien prise en compte`)
    } catch (err) {
        console.log(`Impossible d'effectuer l'acction ${action} : ${err}`)
        req.flash(`Impossible d'effectuer l'acction ${action} : ${err}`)
        res.redirect(`/dashboard/${token}`)
    }
    res.redirect(`/dashboard/${token}`)
}

