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

firebase.auth().onAuthStateChanged(function (user) {

    if (user) {

        panCurrentLocation();

        userID = user.uid;
        userEmail = user.email;
        userName = user.displayName;

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
            openNav();
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
        // made up to the point the web page was loaded
        ref.child(`users`).child(theirUID).once(`value`, function (snapshot) {

            // Get the current friends's profile picture
            storageRef.child("users").child(theirUID).child(`profile.` + snapshot.val()[`profile_pic_format`]).getDownloadURL()
                .then(function (url) {

                    profilePicsDict[theirUID] = url;

                    let theirName = snapshot.val()[`name`];
                    let theirEmail = snapshot.val()[`email`];
                    let theirDevice = snapshot.val()[`device`];
                    colorsDict[theirUID] = snapshot.val()[`color`];

                    if (theirDevice != null) {

                        document.getElementById(`devices`).innerHTML += createHTMLEntry(theirName, theirUID, theirEmail);

                        // Set child listener for when friend location updates
                        ref.child(`users`).child(theirUID).child(`device`)
                            .child(`current`).on(`child_added`, function (snapshot) {

                            addPoint(snapshot, theirUID, map, theirName);
                            createLine(coordDict[theirUID], theirUID, map);

                            // This should fail when the user is currently tracking
                            try {
                                document.getElementById(`not-tracking` + theirUID).innerHTML = ``;
                            } catch (TypeError) {

                            }

                            // Update the 'card' on left hand side
                            changeHTMLTag(theirUID, `battery`, snapshot.val()[`battery`]);
                            changeHTMLTag(theirUID, `speed`, snapshot.val()[`speed`]);

                        });
                    }
                });
        });
    });
});

let createHTMLEntry = (theirName, theirUID, theirEmail) => {

    return `<div class="deviceinfo" id="` + theirUID + `">` +
        `<a href="` + `/users/` + theirUID + `">` + theirName + `</a>` + ` (` + theirEmail + `)` +
        `\n<div id="not-tracking` + theirUID + `">User is not tracking right now</div>` +
        `\n<div id="battery` + theirUID + `"></div>` +
        `\n<div id="speed` + theirUID + `"></div>` +
        `</div>`;

};

let changeHTMLTag = (theirUID, label, value) => {

    let lower = label.toLowerCase();
    let newValue = label + ": " + value;

    try {
        document.getElementById(lower + theirUID).innerHTML = newValue;
    } catch (TypeError) {
    }
};

// Form handler for initial visit information input
let submitForm = () => {

    document.getElementById(`error`).innerHTML = ``;

    let age = document.getElementById(`age`).value;

    let profilePic = $('#photo').get(0).files[0];

    let errorText = ``;

    if (age.length === 0) {
        errorText += `Please enter your age <br />`;
    }

    if (profilePic == null) {
        errorText += `Please upload a photo <br />`;
    }

    if (errorText.length > 0) {
        document.getElementById(`error`).innerHTML = errorText;
        return;
    }

    const typeExtension = profilePic.type.split(`/`)[1].toLowerCase();

    if (typeExtension !== `png` && typeExtension !== `jpg` && typeExtension !== `jpeg`) {
        alert(`Wrong image format!`);
        return;
    }

    const name = `profile.` + typeExtension;
    const metadata = {contentType: profilePic.type};

    ref.child(`users`).child(userID).child(`profile_pic_format`).set(typeExtension);

    let thisReference = storageRef.child(`users`).child(userID).child(name);

    thisReference.put(profilePic, metadata)
        .then(function () {

            document.getElementById(`logout`).innerHTML = userEmail;

            ref.child(`users`).child(userID).update({
                "name": userName,
                "age": parseInt(age),
                "email": userEmail
            }).then(function () {
                closeNav();
            })
        })
};

// Functions for panning the map to the current user's location
let locationSuccess = (pos) => {
    let crd = pos.coords;
    let currentLocation = {
        lat: crd.latitude,
        lng: crd.longitude
    };

    map.panTo(currentLocation);
    map.setZoom(16);
};

let panCurrentLocation = () => {

    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(locationSuccess);
    } else {
        console.log("Not supported");
    }

};

// Functions for initial log in pop-up
let openNav = () => {
    document.getElementById(`myNav`).style.width = `100%`;
};

let closeNav = () => {
    document.getElementById(`myNav`).style.width = `0%`;
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
