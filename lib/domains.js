const config = require("../config")

module.exports.getWhitelistedDomains = async () => {
    const URL = config.GRIST_API_DOMAINS_URL
    const API_KEY = config.GRIST_API_KEY
    const result = await fetch(URL, {headers: {Authorization: `Bearer ${API_KEY}`}})
    const data = await result.json()
    if(data.status !== "success") {
        throw new Error("Error while fetching GRIST API")
    }
    return data.items
}
