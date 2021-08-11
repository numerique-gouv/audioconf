
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
        const room = await conferences.getRoom(config.OVH_ROOM_PHONE_NUMBER, pin)
        const partipantIds = await conferences.getParticipants(config.OVH_ROOM_PHONE_NUMBER, pin)
        const partipants = await Promise.all(partipantIds.map(id => conferences.getParticipant(config.OVH_ROOM_PHONE_NUMBER, pin, id)))
        return res.render("dashboard", {
            room,
            partipants
        })
    } catch (err) {
        console.log(`Impossible de recuperer la room : ${err}`)
        req.flash(`Ce lien n'est plus valide : ${err}`)
        res.redirect("/")
    }
}