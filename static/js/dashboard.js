/* Dashboard function definition */

var FRONT_LABELS = {
    callerNumber: "Numéro",
    arrivalTime: "Heure d'arrivée",
    talking: "En train de parler",
    speak: "En sourdine",
}

var PARTICIPANT_PROPERTIES = [
    "callerNumber",
    "arrivalTime",
    "talking", 
    "speak"
]

var utils = {
    postRequest(url, data, onSuccess, onError) {
        var xhr = new XMLHttpRequest()
        xhr.open("POST", url)
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")

        xhr.onreadystatechange = function() { 
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                if (typeof onSuccess === "function") {
                    onSuccess(xhr)
                }
                // Requête finie, traitement ici.
            } else if (this.readyState === XMLHttpRequest.DONE ) {
                if (typeof onError === "function") {
                    onError(xhr)
                }
            }
        }
        var properties = Object.keys(data)
        xhr.send(properties.map(key => "" + key + "=" + data[key]).join("&"))
    }
}

var elementBuilder = {
    createAction(action, id) {
        var $actionBtn = document.createElement("button")
        $actionBtn.id = id + "-" + action
        $actionBtn.className = "fr-btn"
        $actionBtn.innerText = action === "mute" ? "mettre en sourdine" : "retirer la sourdine"
        $actionBtn.addEventListener("click", function() {
            window.dashboard.participantAction(id, action)
        })
        return $actionBtn
    },
    createParticipantPropertyBox(property, value) {
        var propertiesFrontValue = {
            callerNumber: function(value) { return value},
            arrivalTime: function(value) { return value},
            talking: function(value) { return value ? "oui" : "non" },
            speak: function(value) { return value ? "non" : "oui" },
        }
        var $box = document.createElement("td")
        $box.innerHTML = "<td>" + propertiesFrontValue[property](value) + "<td>"
        return $box
    },
    createTableHeader() {
        var $tableHeader = document.createElement("tr") 
        for (var i=0; i < PARTICIPANT_PROPERTIES.length; i++) {
            $tableHeader.innerHTML += "<th>" + FRONT_LABELS[PARTICIPANT_PROPERTIES[i]] + "</th>"
        }
        $tableHeader.innerHTML += "<th>action</th>"
        return $tableHeader
    },
    createParticipantRow(participantInfo) {
        var $row = document.createElement("tr")
        $row.id = participantInfo.id
        for (var i=0; i < PARTICIPANT_PROPERTIES.length; i++) {
            $row.appendChild(this.createParticipantPropertyBox(PARTICIPANT_PROPERTIES[i], participantInfo[PARTICIPANT_PROPERTIES[i]]))
        }
        if (participantInfo["speak"]) {
            $row.appendChild(this.createAction("mute", participantInfo.id))
        } else {
            $row.appendChild(this.createAction("unmute", participantInfo.id))
        }
        return $row
    },
}

var dashboard = {
    displayError(message) {
        var $notificationError = document.getElementById("notification-error")
        $notificationError.innerHTML = "<p class=\"fr-callout__text\">" + message + "</p>"
        $notificationError.className = $notificationError.className.replace("notification--hidden", "")
    },
    fetchDashboardInfo: function() {
        var displayError = this.displayError
        if (!roomNumberHash) {
            displayError("Ce dashboard ne correspond à aucune conférence")
        }
        utils.postRequest(
            "/dashboard/fetch-dashboard-info",
            { roomNumberHash: roomNumberHash },
            function(req) {
                var data = JSON.parse(req.responseText)
                var $subtitle = document.getElementById("board-description-info")
                $subtitle.innerText = "Pour rejoindre la conférence, appelez le " + data.phoneNumber + " et tapez le code " + data.roomNumber
                var $participantTable = document.getElementById("participant-table")
                $participantTable.innerHTML = ""
                $participantTable.appendChild(elementBuilder.createTableHeader())
                for (var i=0; i < data.participants.length; i++) {
                    var $row = elementBuilder.createParticipantRow(data.participants[i])
                    $participantTable.appendChild($row)
                }
            },
            function(req) {
                var data = JSON.parse(req.responseText)
                displayError(data.error)
            }
        )
    },
    participantAction: function(participantId, action) {
        if (!roomNumberHash) {
            throw new Error(`Il n'y a pas de roomNumberHash`)
        }
        utils.postRequest(
            "/dashboard/" + participantId + "/" + action,
            { roomNumberHash: roomNumberHash },
            function() {
                setTimeout(function() {
                    dashboard.fetchDashboardInfo()
                }, 1000)
            },
            function() {
                this.displayError("L'action n'a pas pu être éxécutée")
            }
        )
    },
}

window.dashboard = dashboard

var roomNumberHash = window.location.hash.substring(1)
window.onload = function() {
    setInterval(function() {
        dashboard.fetchDashboardInfo()
    }, 1000)
}
