
/*

    Filename: maps.js

    Purpose: Helper functions for interacting with the map object on the
            main webapp page (/app/)

    Associated HTML: main_app.html

 */

// Note about these Dicts:
// The 'key' is always the user's UID and the
// 'value' is in the name of the dictionary
// e.g. profilePicsDict[UID] = url for profile picture
let markerDict = {};
let polyLineDict = {};
let coordDict = {};
let profilePicsDict = {};
let infoWindowDict = {};
let colorsDict = {};

let lat;
let lng;

try {
    lat = document.getElementById(`lat`).getAttribute(`content`);
    lng = document.getElementById(`lng`).getAttribute(`content`);
} catch (e) {
    lat = 37.4419;
    lng = -122.1430;
}


const map = new google.maps.Map(document.getElementById(`map`), {
    zoom: 16,
    center: new google.maps.LatLng(lat, lng),
    clickableIcons: false,
    disableDefaultUI: true,
    gestureHandling: 'cooperative',
    styles: [
        {
            "featureType": "administrative.land_parcel",
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        }
    ]
});

// Takes a snapshot and returns a dictionary of values
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

// Adds a point to the map
/* Params:
    snapshot - received from Firebase on child_added
    theirUID - The UID of the user whose point is being plotted
    map - global reference for maps object
    name - the name of the user
 */
let addPoint = (snapshot, theirUID, map, name) => {

    // This makes sure every user only has one InfoWindow at once
    if (infoWindowDict[theirUID] != null) {
        infoWindowDict[theirUID].close();
    }

    let values = getValuesFromSnapshot(snapshot);

    let currentLocation = {
        lat: values["lat"],
        lng: values["lon"]
    };

    let currentMarker = new google.maps.Marker({
        position: currentLocation,
        map: map,
        // No icon

    });

    let iconOptions = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        strokeColor: 'white',
        strokeOpacity: 0.6,
        strokeWeight: 1.0,
        fillColor: colorsDict[theirUID],
        fillOpacity: 1.0
    };

    currentMarker.setIcon(iconOptions);

    document.getElementById(theirUID + `cond-link`).onclick = function () {

        let latLng = new google.maps.LatLng(values["lat"], values["lon"]);
        map.panTo(latLng);

    };

    document.getElementById(theirUID + `exp-link`).onclick = function () {

        let latLng = new google.maps.LatLng(values["lat"], values["lon"]);
        map.panTo(latLng);

    };

    coordDict[theirUID].push(currentLocation);

    // This is a WIP, it's good enough for now
    let contentString = `<div id="windowcontainer"><div id="leftwindow">`;
    contentString += `<img style="max-width: 40px; max-height: 90px;" src="` + profilePicsDict[theirUID] + `">`;
    contentString += `<p class="windowtext">Speed: ` + values['speed'] + `</p>`;
    contentString += `</div><div id="rightwindow">`;
    contentString += `<p style="font-weight:bold;" class="windowtext">` + name + `</p>`;
    contentString += `<p class="windowtext">Battery: ` + values['battery'] + `</p>`;
    contentString += `<p class="windowtext">Time: ` + formatTime(values['time']) + `</p>`;
    contentString += `<p class="windowtext">HR: ` + `123bpm` + `</p>`;
    contentString += `</div></div>`;

    // Set user's current InfoWindow then opens it
    infoWindowDict[theirUID] = new google.maps.InfoWindow({
        content: contentString
    });
    // infoWindowDict[theirUID].open(map, currentMarker);

    currentMarker.addListener('mouseover', function() {
        infoWindowDict[theirUID].open(map, currentMarker);
    });

// assuming you also want to hide the infowindow when user mouses-out
    currentMarker.addListener('mouseout', function() {
        infoWindowDict[theirUID].close();
    });

    let length = markerDict[theirUID].length;

    // 'Hides' all previous markers by making the previous marker invisible
    if (length !== 0) {
        markerDict[theirUID][length - 1].setVisible(false);
    }

    // Pushes current marker to
    markerDict[theirUID].push(currentMarker);

};

// Creates the polyline showing a user's 'path'
/* Params:
    coordList - A list of coordinate (LatLng) values
    map - Global reference for map object
    color - the color of the line to be plotted
 */
let createLine = (coordList, theirUID, map) => {

    let currentColor;

    // TODO: Custom color logic
    currentColor = colorsDict[theirUID];

    if (coordList.length > 0) {

        let currentLine = new google.maps.Polyline({
            path: coordList,
            geodesic: true,
            strokeColor: currentColor,
            strokeOpacity: 1.0,
            strokeWeight: 8
        });

        currentLine.setMap(map);
        polyLineDict[theirUID].push(currentLine);

    }

};

let removeMarker = (theirUID) => {

    let markerLength = markerDict[theirUID].length;

    // Set last marker to blank (all other markers have already
    // been made blank
    markerDict[theirUID][markerLength - 1].setMap(null);

    // Iterate through list of polylines, set map null
    for (let i = 0; i < polyLineDict[theirUID].length; i++){
        polyLineDict[theirUID][i].setMap(null);
    }

    // Reset polyline dict
    polyLineDict[theirUID] = [];

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


// Rounds a number to specified number of decimals
let round = (value, decimals) => {

    return Number(Math.round(value + `e` + decimals) + `e-` + decimals);

};
