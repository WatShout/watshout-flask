/*

    Filename: profile-page.js

    Purpose: Displays information about another user (with data retrieved from
            Firebase) using a Jinja2 template

    Associated HTML: templates/user-page.html

 */

let theirUID = document.getElementById(`uid`).getAttribute(`content`);

let startingPosition = {lat: 37.4419, lng: -122.1430};
const map = new google.maps.Map(document.getElementById(`my-map`), {

    zoom: 1,
    center: startingPosition,
    clickableIcons: false,
    disableDefaultUI: true,

});

// Gets a list of a user's activity IDs
let getActivityIDs = () => {

    try {
        return document.getElementById(`activity_ids`).getAttribute(`content`);
    } catch (ReferenceError) {
        return [];
    }

};

let activity_ids = getActivityIDs();

// Returns an array of all activity IDs because the Jinja2 template returns one long string
// ['that', 'looks', 'like', 'this']
let getActivityList = (linkString) => {

    // Removes whitespace
    linkString = linkString.replace(/ /g,'');

    // Removes [
    linkString = linkString.substring(1);

    // Removes ]
    linkString = linkString.slice(0, -1);

    // Creates an array of <a> tags </a>
    let array = linkString.split(',');

    // Removes the '' around each tag
    for (let i = 0; i < array.length; i++){
        array[i] = array[i].substring(1).slice(0, -1);
    }

    return array;

};

let addPreviousActivities = (id, activityArray) => {

    let pathShown = {};

    for (let i = 0; i < activityArray.length; i++){

        let activity_name = activityArray[i];

        let script = `getThisActivity(` + `'` + id.toString() + `',` + `'` + activity_name.toString() + `')`;


        let html = `<div class="activity_container">`;

        html += `<input id="` + activity_name + `" class="activity_button" value="Toggle" type="button" onclick="` + script + `">`;

        html += `</div>`;

        document.getElementById(`content`).innerHTML += html;

        pathShown[activity_name] = false;

    }

};

// Overlays the path for an activity on the map
let createPath = (snapshot, event_name) => {

    if (!pathShown[event_name]){
        let markers = [];
        let path = [];

        snapshot.forEach(function (child) {

            let lat = child.val()[`lat`];
            let lon = child.val()[`lon`];

            let currentPosition = {
                lat: lat,
                lng: lon
            };

            let currentMarker = new google.maps.Marker({
                position: currentPosition,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 0
                }
            });

            markers.push(currentMarker);
            path.push(currentPosition);

        });

        let currentLine = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: `#FF0000`,
            strokeOpacity: 1.0,
            strokeWeight: 6
        });

        document.getElementById(event_name).style.backgroundColor = "#fbff87";
        pathShown[event_name + `line`] = currentLine;
        pathShown[event_name + `line`].setMap(map);
        pathShown[event_name] = true;
    }
    else {
        document.getElementById(event_name).style.backgroundColor = "#4a4d51";
        pathShown[event_name + `line`].setMap(null);
        pathShown[event_name] = false;
    }


};

let getThisActivity = (id, event_name) => {

    ref.child(`users`).child(id).child(`device`).child(`past`).child(event_name).child(`path`)
        .once(`value`, function (snapshot) {

            createPath(snapshot, event_name);

        });

};

// Unlinks Strava account and re-adds the 'link with Strava' button
let unlinkStrava = () => {

    ref.child(`users`).child(myUID).child(`strava_token`).once(`value`, function(snapshot) {

        snapshot.ref.remove();

        let element = document.getElementById(`unlink`);
        element.parentNode.removeChild(element);

        document.getElementById(`strava_info`).innerHTML =
            `<a href="strava/login" ><img src="/static/res/small_strava_button.png"></a>`

    })

};

// Code only runs if the user has more than 0 activities
if (activity_ids.length !== 0){
    addPreviousActivities(theirUID, getActivityList(activity_ids));
}

