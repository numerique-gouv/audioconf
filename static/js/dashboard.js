var token = window.location.hash.substring(1)

window.onload = function() {
    var initDate = new Date()
    window.dashboard.getParticipants()
    setInterval(function() {
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
    var $actionBtn = document.createElement("span")
    $actionBtn.id = id + "-" + action
    $actionBtn.innerText = action === "mute" ? "mettre en sourdine" : "retirer la sourdine"
    $actionBtn.onclick = "dashboard.participantAction(" + id + ", " + action + ")"
    return $actionBtn
}

function createParticipantPropertyBox(property) {
    var $box = document.createElement("td")
    $box.innerHTML = "<td>" + property + "<td>"
    return $box
}

function createTableHeader() {
    var $tableHeader = document.createElement("tr") 
    for (var i=0; i < PARTICIPANT_PROPERTIES.length; i++) {
        $tableHeader.innerHTML += "<th>" + PARTICIPANT_PROPERTIES[i] + "</th>"
    }
    $tableHeader.innerHTML += "<th>action</th>"
    return $tableHeader
}

function createParticipantRow(participantInfo) {
    var $row = document.createElement("tr")
    $row.id = participantInfo.id
    for (var i=0; i < PARTICIPANT_PROPERTIES.length; i++) {
        $row.appendChild(createParticipantPropertyBox(participantInfo[PARTICIPANT_PROPERTIES[i]]))
    }
    if (participantInfo["speak"]) {
        $row.appendChild(createAction("mute"))
    } else {
        $row.appendChild(createAction("unmute"))
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