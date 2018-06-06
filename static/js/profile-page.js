/*

    Filename: profile-page.js

    Purpose: Displays information about another user (with data retrieved from
            Firebase) using a Jinja2 template

    Associated HTML: templates/user-page.html

 */

let getTheirUID = () => document.getElementById(`uid`).getAttribute(`content`);

let theirUID = getTheirUID();

let startingPosition = {lat: 37.4419, lng: -122.1430};

const map = new google.maps.Map(document.getElementById(`my-map`), {

    zoom: 14,
    center: startingPosition,
    clickableIcons: false,
    disableDefaultUI: true,

});

firebase.auth().onAuthStateChanged(function(user) {

    // Initializes the Google Map.


    if (user) {

        let myUID = user.uid;

        if (myUID === theirUID){

            // User is viewing their own profile

            addPreviousActivities(myUID, getActivityList(activity_ids));

        }
        else {

            document.getElementById(`strava_info`).innerHTML = ``;

            ref.child(`friend_data`).child(theirUID).child(myUID).once('value', function(snapshot) {

                // Users are NOT friends
                if (!snapshot.exists()){

                    alert(`You are not friends with this user`);

                    window.history.back();

                }
                // Users are friends
                else {

                    let timeInSeconds = snapshot.val() / 1000;

                    let date = new Date(0);

                    date.setUTCSeconds(timeInSeconds);

                    document.getElementById(`since`).innerHTML =
                        `You have been friends since ` + date;
                }

            });

            addPreviousActivities(theirUID, getActivityList(activity_ids));
        }



    } else {

        window.location.replace(`/login/`);

    }
});

let activity_ids = document.getElementById(`activity_ids`).getAttribute(`content`);

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

    elementArray = [];

    for (let i = 0; i < activityArray.length; i++){

        let activity_name = activityArray[i];

        let html = `<div class="activity_container">`;

        html += `<input type="button" id="` + activity_name + `">`;

        html += `</div>`;

        document.getElementById(`content`).innerHTML += html;

        let currentElement = document.getElementById(activity_name);

        elementArray.push(currentElement)

    }


    elementArray.forEach(function (child) {

        let eventID = child.id;

        child.addEventListener(`click`, function () {

            return function () {

                console.log(eventID);

                ref.child(`users`).child(id).child(`device`).child(`past`).child(eventID).child(`path`)
                    .once(`value`, function (snapshot) {

                        console.log(snapshot.val());

                    });
            }

        });

    })

};
