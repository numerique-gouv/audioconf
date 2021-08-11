
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
        const room = await conferences.getRoom(pin)
        console.log('Get room', room)
        if (!room) {
            throw new Error(`Cette room n'existe plus ou pas`)
        } else {
            return res.render("dashboard", {
                room
            })
        }
    } catch (err) {
        console.log(`Impossible de recuperer la room : ${err}`)
        req.flash(`Ce lien n'est plus valide : ${err}`)
        res.redirect("/")
    }
}
