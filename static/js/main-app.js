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

                    if (theirDevice != null) {

                        // Set child listener for when friend location updates
                        ref.child(`users`).child(theirUID).child(`device`)
                            .child(`current`).on(`child_added`, function (snapshot) {

                            if (document.getElementById(`panTo` + theirUID) == null){

                                document.getElementById(`devices`).appendChild(createHTMLEntry(getInitials(theirName), theirUID, theirColor));

                                //document.getElementById('devices').appendChild(createHTMLEntry(getInitials(theirName), theirUID,
                                //    theirColor));

                            }

                            addPoint(snapshot, theirUID, map, theirName);
                            createLine(coordDict[theirUID], theirUID, map);


                            /*
                            // This should fail when the user is currently tracking
                            try {
                                document.getElementById(`not-tracking` + theirUID).innerHTML = theirName;
                            } catch (TypeError) {

                            }
                            */


                        });

                        // Set listener for when activity is over
                        ref.child(`users`).child(theirUID).child(`device`)
                            .on(`child_removed`, function (snapshot) {

                                if (snapshot.key === `current`){

                                    // TODO: Implement this
                                    removeMarker(theirUID);

                                    // Set name card to say 'is not tracking right now'
                                    document.getElementById(theirUID).innerHTML = ``;

                                }

                        })
                    }
                });
        });
    });
});

let createHTMLEntry = (theirInitials, theirUID, theirColor) => {

    console.log(theirInitials);
    console.log(theirColor);
    console.log(theirUID);

    let a = document.createElement('a');
    let linkText = document.createTextNode(theirInitials);
    a.appendChild(linkText);
    a.href = "#";
    document.body.appendChild(a);
    a.id = `panTo` + theirUID;
    a.className = `deviceinfo`;
    a.onclick = function () {
        console.log(`Hasn't been changed`);
    };
    a.style.background = theirColor;

    return a;

    //return `<a id="panTo` + theirUID + `" class="deviceinfo" href="#">` + theirInitials + `</a>`;

    //return`<a style="width: 100%;height: 100%; background: ` + theirColor + `;" id="panTo` + theirUID + `"` + ` href="#" onclick="console.log('hi')">` + theirInitials + `</a>`;
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
