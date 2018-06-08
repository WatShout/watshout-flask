
/*

    Filename: main.js

    Purpose: Provide functions for interacting with friends list while on
            the main webapp page (/app/)

    Associated HTML: main_app.html

 */

// These pertain to the currently logged-in user
let userID;
let userEmail;

firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        userID = user.uid;
        userEmail = user.email;

        if (!user.emailVerified){

            user.sendEmailVerification().then(function() {

                console.log(`Email sent`);

            }, function(error) {
                // An error happened.
            });

        } else {

            $.ajax({

                'url' : '/cookies/verified/create/',
                'type' : 'GET',

                'success' : function() {
                    //console.log(`Created cookie`);
                },
                'error' : function() {
                    console.log(`error`)
                }
            });

        }


        ref.child(`users`).child(userID).once(`value`, function(snapshot) {

            // Indicates that a user is `new`
            if (!snapshot.exists()) {

                let age = prompt("Enter your age");

                ref.child(`users`).child(user.uid).update({
                    "name": user.displayName,
                    "age": parseInt(age),
                    "email": user.email
                });
            }
        });

    }


    // Plots current paths by all friends
    ref.child(`friend_data`).child(userID).on(`child_added`, function(snapshot) {

        let theirUID = snapshot.key;

        deviceDict[theirUID] = [];

        // For each friend currently in an activity this plots all the points
        // made up to the point the web page was loaded
        ref.child(`users`).child(theirUID).once(`value`, function(snapshot) {

            let theirName = snapshot.val()[`name`];
            let theirEmail = snapshot.val()[`email`];
            let theirDevice = snapshot.val()[`device`];

            // TODO: console.log(snapshot.val()[`device`]);

            // TODO: Fix behavior when a user, already a friend, adds a device
            if (theirDevice != null) {
                document.getElementById(`devices`).innerHTML +=

                    createHTMLEntry(theirName, theirUID, theirEmail);

                ref.child(`users`).child(theirUID).child(`device`)
                    .child(`current`).on(`child_added`, function (snapshot) {

                    addPoint(snapshot, theirUID, map);
                    createLine(deviceDict[theirUID], map);

                    // This should fail when the user is currently tracking
                    try {
                        document.getElementById(`not-tracking` + theirUID).innerHTML = ``;
                    } catch (TypeError){

                    }

                    changeHTMLTag(theirUID, `battery`, snapshot.val()[`battery`]);
                    changeHTMLTag(theirUID, `speed`, snapshot.val()[`speed`]);

                });

            }
        });
    });
});


let createHTMLEntry = (theirName, theirUID, theirEmail) => {

    let html = `<div class="deviceinfo" id="` + theirUID + `">` +
            `<a href="` + `/users/` + theirUID + `">` + theirName + `</a>` + ` (` + theirEmail + `)` +
            `\n<div id="not-tracking` + theirUID + `">User is not tracking right now</div>` +
            `\n<div id="battery` + theirUID + `"></div>` +
            `\n<div id="speed` + theirUID + `"></div>` +
            `</div>`;

    return html;

};

let changeHTMLTag = (theirUID, label, value) => {

    let lower = label.toLowerCase();

    let newValue = label + ": " + value;

    try{
        document.getElementById(lower + theirUID).innerHTML = newValue;
    } catch(TypeError){
        //createHTMLEntry(id);
        //document.getElementById(lower + id).innerHTML = newValue;
    }
};





