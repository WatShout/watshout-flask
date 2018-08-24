/*

    Filename: main.js

    Purpose: Provide functions for interacting with friends list while on
            the main webapp page (/app/)

    Associated HTML: main_app.html

 */

// These pertain to the currently logged-in user
let userID;
let userEmail;
let userName;

// Functions for initial log in pop-up
let openNav = () => {
    document.getElementById(`myNav`).style.width = `100%`;
};

let closeNav = () => {
    document.getElementById(`myNav`).style.width = `0%`;
};

firebase.auth().onAuthStateChanged(function (user) {

    if (user) {

        panCurrentLocation();

        let cookieUID = document.getElementById(`uid`).getAttribute(`content`);

        userID = user.uid;
        userEmail = user.email;
        userName = user.displayName;

        checkIfCookieAltered(userID, cookieUID);

        let hasInfo = document.getElementById(`has_info`).getAttribute(`content`);

        // If user isn't verified then send email
        if (!user.emailVerified) {

            user.sendEmailVerification().then(function () {

                console.log(`Email sent`);

            }, function (error) {
                // An error happened.
            });

        }

        // If user is verified then create HTTP cookie
        else {

            $.ajax({

                'url': '/cookies/verified/create/',
                'type': 'GET',

                'success': function () {
                    //console.log(`Created cookie`);
                },
                'error': function () {
                    console.log(`error`)
                }
            });
        }

        // If user is verified but doesn't have info, open input nav
        if (hasInfo === `no`) {
            location.href = `/new/`;
        }
    }

    // User isn't authenticated
    else {
        window.location.href = "/login/";
    }

    // Gets list of all friends
    ref.child(`friend_data`).child(userID).on(`child_added`, function (snapshot) {

        let theirUID = snapshot.key;

        markerDict[theirUID] = [];
        coordDict[theirUID] = [];

        // For each friend currently in an activity this plots all the points
        ref.child(`users`).child(theirUID).once(`value`, function (snapshot) {

            // Get the current friends's profile picture
            storageRef.child("users").child(theirUID).child(`profile.` + snapshot.val()[`profile_pic_format`]).getDownloadURL()
                .then(function (url) {

                    profilePicsDict[theirUID] = url;

                    let theirName = snapshot.val()[`name`];
                    let theirEmail = snapshot.val()[`email`];
                    let theirDevice = snapshot.val()[`device`];
                    let theirColor = getRandomColor();
                    colorsDict[theirUID] = theirColor;
                    polyLineDict[theirUID] = [];

                    if (theirDevice != null) {

                        // Set child listener for when friend location updates
                        ref.child(`users`).child(theirUID).child(`device`)
                            .child(`current`).on(`child_added`, function (snapshot) {


                            if (document.getElementById(theirUID + `expanded`) == null){

                                document.getElementById(`active-runners-exp`).innerHTML += createExpandedHTML(theirName, theirUID, theirColor);
                                document.getElementById(`active-runners-cond`).innerHTML += createCondensedHTML(getInitials(theirName), theirUID, theirColor);
                            }

                            addPoint(snapshot, theirUID, map, theirName);
                            createLine(coordDict[theirUID], theirUID, map);

                        });

                        // Set listener for when activity is over
                        ref.child(`users`).child(theirUID).child(`device`)
                            .on(`child_removed`, function (snapshot) {

                                if (snapshot.key === `current`){

                                    removeMarker(theirUID);

                                    let cond = document.getElementById(theirUID + `cond-link`);
                                    cond.parentNode.removeChild(cond);

                                    let exp = document.getElementById(theirUID + `exp-link`);
                                    exp.parentNode.removeChild(exp);

                                }

                        })
                    }
                });
        });
    });
});

let createCondensedHTML = (theirInitials, theirUID, theirColor) => {

    let idName = theirUID + `condensed`;

    let htmlString =
        `<a href="#" id="` + theirUID + `cond-link">
            <div id="` + idName + `" class="runner-circ" style="background-color: ` + theirColor + `;">
                <div class="initials">` + theirInitials + `</div>
            </div>
        </a>`;

    return htmlString;

};

let createExpandedHTML = (theirName, theirUID, theirColor) => {

    let idName = theirUID + `expanded`;

    let htmlString =
        `<a href="#" id="` + theirUID + `exp-link"><div id="` + idName + `">
            <div class="runner-block">
                <div class="ar-circle"><div id="circ" style="background-color: ` + theirColor + `;"></div></div>
                <table class="ar-data">
                    <tr><td class="ar-name" colspan="2">` + theirName + `</td><tr>
                    <tr>
                        <td class="ar-duration">Duration</td>
                        <td class="ar-heart-rate">HR</td>
                    </tr>
                </table>
            </div>
        </div>
        </a>`;

    return htmlString;

    };

let getInitials = (name) => {

    let matches = name.match(/\b(\w)/g);// ['J','S','O','N']
    let acronym = matches.join('');

    return acronym;

};

// Functions for panning the map to the current user's location
let locationSuccess = (pos) => {
    let crd = pos.coords;
    let currentLocation = {
        lat: crd.latitude,
        lng: crd.longitude
    };

    createLocationCookies(crd.latitude, crd.longitude);

    map.panTo(currentLocation);
    map.setZoom(16);
};

let createLocationCookies = (lat, lng) => {

    $.ajax({

        'url': '/cookies/set_location/'+ lat + ',' + lng + '/',
        'type': 'GET',

        'success': function () {
            //console.log(`Created cookie`);
        },
        'error': function (error) {
            console.log(error)
        }
    });

};

let panCurrentLocation = () => {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(locationSuccess);
    } else {
        console.log("Not supported");
    }

};

let getRandomColor = () => {
  let letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// These handle displaying the selected image on the screen
$(function () {
    $(":file").change(function () {
        if (this.files && this.files[0]) {
            let reader = new FileReader();
            reader.onload = imageIsLoaded;
            reader.readAsDataURL(this.files[0]);
        }
    });
});

let imageIsLoaded = (e) => {

    document.getElementById(`myImg`).src = e.target.result;

};
