
/*

    Filename: maps.js

    Purpose: Helper functions for interacting with the map object on the
            main webapp page (/app/)

    Associated HTML: main_app.html

 */

let startingPosition = {lat: 37.4419, lng: -122.1430};

let deviceDict = {};
let theirProfilePics = {};
let popUpDict = {};

// Initializes the Google Map.
const map = new google.maps.Map(document.getElementById(`map`), {

    zoom: 14,
    center: startingPosition,
    clickableIcons: false,
    disableDefaultUI: true,

});


// Gets needed values from snapshot object
let getValuesFromSnapshot = (snapshot) => {

    let values = {};

    values["lat"] = snapshot.val()["lat"];
    values["lon"] = snapshot.val()["lon"];
    values["time"] = snapshot.val()["time"];
    values["speed"] = snapshot.val()["speed"];
    values["bearing"] = snapshot.val()["bearing"];
    values["battery"] = snapshot.val()["battery"];

    return values;

};


// Performs HTML updates for every tag
let updateHTML = (id, values, map) => {

    /*

    changeHTMLTag(id, `Device`, id);
    changeHTMLTag(id, `Speed`, values["speed"]);
    changeHTMLTag(id, `Time`, formatTime(values["time"]));
    changeHTMLTag(id, `Battery`, round(values["battery"], 0) + `%`);

    document.getElementById(`click` + id).onclick = function () {
        map.panTo({lat: values["lat"], lng: values["lon"]});
    };

    */

};

let getPast = (id) => {

    ref.child(`users`).child(id).child(`device`).child(`past`).orderByChild(`time`).limitToLast(1).once("value", function(snapshot) {

        let key = Object.keys(snapshot.val());

        let path = snapshot.child(key).child(`path`);

        path.forEach(function (childSnapshot) {

            addPoint(childSnapshot, id, map);

            // Once the button is clicked once, it doesn't do anything
            document.getElementById(`past` + id).onclick = function() {};

        })
    });
};

let addPoint = (snapshot, currentID, map, name) => {

    if (popUpDict[currentID] != null) {
        popUpDict[currentID].close();
    }

    let values = getValuesFromSnapshot(snapshot);

    //updateHTML(currentID, values, map);

    let icon = {
        url: theirProfilePics[currentID],
        scaledSize: new google.maps.Size(30, 30) // scaled size

    };

    // Adds marker to map
    let currentMarker = new google.maps.Marker({
        position: {
            lat: values["lat"],
            lng: values["lon"]
        },
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0
        }
    });

    let contentString = `<div id="windowcontainer"><div id="leftwindow">`;
    contentString += `<img style="max-width: 40px; max-height: 90px;" src="` + theirProfilePics[currentID] + `">`;
    contentString += `<p class="windowtext">Speed: ` + values['speed'] + `</p>`;
    contentString += `</div><div id="rightwindow">`;
    contentString += `<p style="font-weight:bold;" class="windowtext">` + name + `</p>`;
    contentString += `<p class="windowtext">Battery: ` + values['battery'] + `</p>`;
    contentString += `<p class="windowtext">Time: ` + formatTime(values['time']) + `</p>`;
    contentString += `<p class="windowtext">HR: ` + `123bpm` + `</p>`;
    contentString += `</div></div>`;

    let infowindow = new google.maps.InfoWindow({
          content: contentString
    });

    popUpDict[currentID] = infowindow;

    let length = deviceDict[currentID].length;

    // If list only has one object, then previous is the same as current
    if (length !== 0) {
        deviceDict[currentID][length - 1].setVisible(false);
    }

    popUpDict[currentID].open(map, currentMarker);

    //map.panTo(new google.maps.LatLng(values["lat"], values["lon"]));

    deviceDict[currentID].push(currentMarker);

};

let createLine = (markers, map, color) => {

    let currentPath = [];

    for (let i = 0; i < markers.length; i++){

        currentPath.push({
            lat: markers[i].getPosition().lat(),
            lng: markers[i].getPosition().lng()
        });

    }

    let currentColor;
    if (color == null){
        currentColor = '#0000FF'
    }else {
        currentColor = color;
    }
    if (length > 0) {

        let currentLine = new google.maps.Polyline({
            path: currentPath,
            geodesic: true,
            strokeColor: currentColor,
            strokeOpacity: 1.0,
            strokeWeight: 6
        });

        currentLine.setMap(map);

    }

};

// Create a new JavaScript Date object based on the timestamp
let formatTime = (milliseconds) => {

    let date = new Date(milliseconds);
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    let seconds = "0" + date.getSeconds();

    // Will display time in 10:30:23 format
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

};



let round = (value, decimals) => {

    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);

};
