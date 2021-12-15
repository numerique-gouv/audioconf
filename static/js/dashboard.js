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
    postRequest(url, data, callback) {
        var xhr = new XMLHttpRequest()
        xhr.open("POST", url)
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")

        xhr.onreadystatechange = function() { 
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                if (typeof callback === "function") {
                    callback(xhr)
                }
                // Requête finie, traitement ici.
            }
        }
        var properties = data.keys()
        xhr.send(properties.map(key => "" + key + "=" + data[key]).join('&'))
    }
}

var elementBuilder = {
    createAction(action, id) {
        var $actionBtn = document.createElement("button")
        $actionBtn.id = id + "-" + action
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
    }
}

var dashboard = {
    fetchDashboardInfo: function() {
        if (!roomNumberHash) {
            throw new Error(`Il n'y a pas de roomNumberHash`)
        }
        utils.postRequest(
            "/dashboard/fetch-dashboard-info",
            { roomNumberHash: roomNumberHash },
            function(req) {
                var data = JSON.parse(req.responseText)
                var $participantTable = document.getElementById("participant-table")
                $participantTable.innerHTML = ""
                $participantTable.appendChild(elementBuilder.createTableHeader())
                var $phoneNumber = document.getElementById("phone-number")
                $phoneNumber.innerText = data.phoneNumber
                var $roomNumber = document.getElementById("room-number")
                $roomNumber.innerText = data.roomNumber
                for (var i=0; i < data.participants.length; i++) {
                    var $row = elementBuilder.createParticipantRow(data.participants[i])
                    $participantTable.appendChild($row)
                }
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
