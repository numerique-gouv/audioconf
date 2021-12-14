var token = window.location.hash.substring(1)

var FRONT_LABELS = {
    callerNumber: "Numéro",
    arrivalTime: "Heure d'arrivée",
    talking: "En train de parler",
    speak: "En sourdine",
}

window.onload = function() {
    var initDate = new Date()
    setInterval(function() {
        window.dashboard.getParticipants()
        var currentDate = new Date()
        var id = document.getElementById("last-update")
        id.innerText = Math.floor((currentDate.getTime() - initDate.getTime())/1000)
    }, 1000)
}

function postRequest(url, token, callback) {
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
    xhr.send("token=" + token)
}

var PARTICIPANT_PROPERTIES = [
    "callerNumber",
    "arrivalTime",
    "talking", 
    "speak"
]

function createAction(action, id) {
    var $actionBtn = document.createElement("button")
    $actionBtn.id = id + "-" + action
    $actionBtn.innerText = action === "mute" ? "mettre en sourdine" : "retirer la sourdine"
    $actionBtn.addEventListener("click", function(event) {
        window.dashboard.participantAction(id, action)
    })
    return $actionBtn
}

function createParticipantPropertyBox(property, value) {
    var propertiesFrontValue = {
        callerNumber: function(value) { return value},
        arrivalTime: function(value) { return value},
        talking: function(value) { return value ? "oui" : "non" },
        speak: function(value) { return value ? "oui" : "non" },
    }
    var $box = document.createElement("td")
    $box.innerHTML = "<td>" + propertiesFrontValue[property](value) + "<td>"
    return $box
}

function createTableHeader() {
    var $tableHeader = document.createElement("tr") 
    for (var i=0; i < PARTICIPANT_PROPERTIES.length; i++) {
        $tableHeader.innerHTML += "<th>" + FRONT_LABELS[PARTICIPANT_PROPERTIES[i]] + "</th>"
    }
    $tableHeader.innerHTML += "<th>action</th>"
    return $tableHeader
}

function createParticipantRow(participantInfo) {
    var $row = document.createElement("tr")
    $row.id = participantInfo.id
    for (var i=0; i < PARTICIPANT_PROPERTIES.length; i++) {
        $row.appendChild(createParticipantPropertyBox(PARTICIPANT_PROPERTIES[i], participantInfo[PARTICIPANT_PROPERTIES[i]]))
    }
    if (participantInfo["speak"]) {
        $row.appendChild(createAction("mute", participantInfo.id))
    } else {
        $row.appendChild(createAction("unmute", participantInfo.id))
    }
    return $row
}

window.dashboard = {
    getParticipants: function() {
        if (!token) {
            throw new Error(`Il n'y a pas de token`)
        }
        postRequest("/dashboard/get-participants", token, function(req) {
            var data = JSON.parse(req.responseText)
            var $participantTable = document.getElementById("participant-table")
            $participantTable.innerHTML = ""
            $participantTable.appendChild(createTableHeader())
            for (var i=0; i < data.participants.length; i++) {
                var $row = createParticipantRow(data.participants[i])
                $participantTable.appendChild($row)
            }
        })
        
    },
    participantAction: function(participantId, action) {
        if (!token) {
            throw new Error(`Il n'y a pas de token`)
        }
        postRequest("/dashboard/" + participantId + "/" + action, token, function() {
            setTimeout(function() {
                window.dashboard.getParticipants()
            }, 1000)
        })       
    },
}