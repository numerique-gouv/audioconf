
module.exports.isAcceptedEmail = (email, whitelist) => {
    for (const regex of whitelist) {
        if (regex.test(email)) {
        return true
        }
    }
    return false
}

module.exports.isValidEmail = (email) => {
    if (
        email === undefined ||
        !/^([a-zA-Z0-9_\-\.']+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(email)
    ) {
        return false
    }
    return true
}
  
  