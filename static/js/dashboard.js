var token = window.location.hash.substring(1)

window.onload = function() {
    var initDate = new Date()
    setInterval(function() {
        var currentDate = new Date()
        var id = document.getElementById("last-update")
        id.innerText = Math.floor((currentDate.getTime() - initDate.getTime())/1000)
    }, 1000)
}

window.participantAction = function(participantId, action) {
    if (token) {
        throw new Error("Il n'y a pas de token de connexion")
    }
    var xhr = new XMLHttpRequest()
    xhr.open("POST", "/dashboard/" + participantId + "/" + action, true)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")

    xhr.onreadystatechange = function() { //Appelle une fonction au changement d'état.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            // Requête finie, traitement ici.
        }
    }
    xhr.send("token=" + token)
}