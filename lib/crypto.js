const crypto = require("crypto")
const config = require("../config")
const algorithm = "aes-256-ctr"
const iv = crypto.randomBytes(16)

const encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, config.SECRET, iv)
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
    return iv.toString("hex") + ":" +encrypted.toString("hex")
}

const decrypt = (hash) => {
    let splitHash = hash.split(":")
    const iv = splitHash[0]
    const content = splitHash[1]
    const decipher = crypto.createDecipheriv(algorithm, config.SECRET, Buffer.from(iv, "hex"))

    const decrpyted = Buffer.concat([decipher.update(Buffer.from(content, "hex")), decipher.final()])

    return decrpyted.toString()
}

module.exports = {
    encrypt,
    decrypt
}