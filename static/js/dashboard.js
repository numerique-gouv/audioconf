window.onload = function() {
    var initDate = new Date()
    setInterval(function() {
        var currentDate = new Date()
        var id = document.getElementById("last-update")
        id.innerText = Math.floor((currentDate.getTime() - initDate.getTime())/1000)
    }, 1000)
    setTimeout("location.reload(true);", 5)
}