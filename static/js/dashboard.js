var token = window.location.hash.substring(1)

window.onload = function() {
    var initDate = new Date()
    setInterval(function() {
        var currentDate = new Date()
        var id = document.getElementById("last-update")
        id.innerText = Math.floor((currentDate.getTime() - initDate.getTime())/1000)
    }, 1000)
}

window.dashboard = {
    postRequest: function(url, token, callback) {
        var xhr = new XMLHttpRequest()
        xhr.open("POST", url)
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")

        xhr.onreadystatechange = function() { //Appelle une fonction au changement d'état.
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                if (typeof callback === "function") {
                    callback()
                }
                // Requête finie, traitement ici.
            }
        }
        xhr.send("token=" + token)
    },
    getParticipants: function() {
        if (!token) {
            throw new Error(`Il n'y a pas de token`)
        }
        window.dashboard.postRequest("/dashboard", token)
    },
    participantAction: function(participantId, action) {
        if (!token) {
            throw new Error(`Il n'y a pas de token`)
        }
        window.dashboard.postRequest("/dashboard/" + participantId + "/" + action, token)       
    },
}