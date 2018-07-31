
/*

    Filename: previous-activity.js

    Purpose: Plots a previous route on a map

    Associated HTML: templates/activity.html

 */

let theirUID = document.getElementById(`uid`).getAttribute(`content`);
let activity_id = document.getElementById(`activity_id`).getAttribute(`content`);

firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        let myUID = user.uid;

        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                let browserUID = user.uid;
                let serverUID = document.getElementById(`uid`).getAttribute(`content`);

                checkIfCookieAltered(browserUID, serverUID);

            }
        });

        // User is viewing their own ride
        if (myUID === theirUID){

            console.log("Self");

        }

        else {

            ref.child(`friend_data`).child(theirUID).child(myUID).once('value', function(snapshot) {

                // If snapshot doesn't exist, then users are not friends
                if (!snapshot.exists()){

                    alert(`You are not friends with this user`);

                    window.history.back();

                }

            });

        }


    } else {

        window.location.replace(`/login/`);

    }
});

// Initializes the Google Map.
const map = new google.maps.Map(document.getElementById(`map`), {

    zoom: 14,
    center: {lat: 0, lng: 0},
    clickableIcons: false,
    disableDefaultUI: true,

});

let markers = [];

let addPoint = (snapshot) => {

    let lat = snapshot.val()["lat"];
    let lon = snapshot.val()["lon"];

    let latlng = {
            lat: lat,
            lng: lon
        };

    // Adds marker to map
    let currentMarker = new google.maps.Marker({
        position: latlng,
        map: map
    });

    map.panTo(latlng);

    let length = markers.length;

    // If list only has one object, then previous is the same as current
    if (length !== 0) {
        markers[length - 1].setVisible(false);
    }

    markers.push(currentMarker);

    createLine(markers, map);


};

let createLine = (markers, map) => {

    let currentPath = [];

    for (let i = 0; i < markers.length; i++){

        currentPath.push({
            lat: markers[i].getPosition().lat(),
            lng: markers[i].getPosition().lng()
        });

    }

    if (length > 0) {

        let currentLine = new google.maps.Polyline({
            path: currentPath,
            geodesic: true,
            strokeColor: `#FF0000`,
            strokeOpacity: 1.0,
            strokeWeight: 6
        });

        currentLine.setMap(map);

    }

};


ref.child(`users`).child(theirUID).child(`device`)
    .child(`past`).child(activity_id).child(`path`)
    .once(`value`, function (snapshot) {

    snapshot.forEach(function (child) {

        addPoint(child);

    })

});