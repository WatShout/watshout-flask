
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

        document.getElementById(`logout`).innerText = user.email;

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

        try {
            document.getElementById(`profile`).href = `/users/` + userID + `/`;
        } catch (e) {
            console.log(e + ` couldn't set profile link`);
        }

        try {
            document.getElementById(`friends`).href = `/users/` + userID + `/friends/`;
        } catch (e) {
            console.log(e + ` couldn't set friend link`);
        }



    } else {
        console.log(`logged out`);
        window.location.replace(`/login/`);
    }


    // Plots current paths by all friends
    ref.child(`friend_data`).child(userID).on(`child_added`, function(snapshot) {

        let theirID = snapshot.key;

        deviceDict[theirID] = [];

        // For each friend currently in an activity this plots all the points
        // made up to the point the web page was loaded
        ref.child(`users`).child(theirID).once(`value`, function(snapshot) {

            let theirName = snapshot.val()[`name`];
            let theirEmail = snapshot.val()[`email`];
            let theirDevice = snapshot.val()[`device`];

            // TODO: console.log(snapshot.val()[`device`]);

            // TODO: Fix behavior when a user, already a friend, adds a device
            if (theirDevice != null) {
                document.getElementById(`devices`).innerHTML +=
                    createHTMLEntry(theirName, theirID);

                ref.child(`users`).child(theirID).child(`device`)
                    .child(`current`).on(`child_added`, function (snapshot) {

                    addPoint(snapshot, theirID, map);
                    createLine(deviceDict[theirID], map);

                    document.getElementById(`not-tracking` + theirID).innerHTML = ``;

                    changeHTMLTag(theirID, `battery`, snapshot.val()[`battery`]);
                    changeHTMLTag(theirID, `speed`, snapshot.val()[`speed`]);

                });

            }
        });
    });
});

let searchByEmail = (query) => {

    ref.child(`users`).orderByChild(`email`).equalTo(query).once(`value`, function(snapshot) {

        if(snapshot.exists()){
            let theirID = Object.keys(snapshot.val())[0];


            ref.child(`friends`).child(theirID).child(userID).set(
                {
                    "request_type": "received"
                }
            );

            ref.child(`friends`).child(userID).child(theirID).set(
                {
                    "request_type": "sent"
                }
            )

        }

    });
};

let searchByID = (theirID) => {

    ref.child(`users`).child(theirID).child(`email`).once(`value`, function(snapshot) {

        if(snapshot.exists()){

            return snapshot.val();

        } else {
            return "test";
        }

    });
};




