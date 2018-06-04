
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

        document.getElementById(`hello`).innerHTML = `Hi: ` + userEmail + `<br />` +
            `User ID: ` + userID;


    } else {
        console.log(`logged out`);
        window.location.replace(`/login/`);
    }

    // Checks for current pending friend requests
    ref.child(`friend_requests`).child(userID).on("child_added", function(snapshot) {

        let theirID = snapshot.key;
        let request_type = snapshot.val()[`request_type`];

        if(request_type === "received"){

            ref.child(`users`).child(theirID).child(`email`).on(`value`, function(snapshot) {

                document.getElementById(`pending`).innerHTML +=
                    `<a id="friend` + theirID + `" onclick=confirmFriend("` + theirID + `") href="#">` + snapshot.val() + `</a><br />`;

            });
        }
    });

    // Plots current paths by all friends
    ref.child(`friend_data`).child(userID).on(`child_added`, function(snapshot) {

            let theirID = snapshot.key;

            deviceDict[theirID] = [];

            // For each friend currently in an activity this plots all the points
            // made up to the point the web page was loaded
            ref.child(`users`).child(theirID).once(`value`, function(snapshot) {

                let theirEmail = snapshot.val()[`email`];
                let theirDevice = snapshot.val()[`device`];

                // Adds friend to friends list
                document.getElementById(`accepted`).innerHTML += `<a href="/users/` + theirID + `">` + theirEmail + `</a><br />`;

                // TODO: Fix behavior when a user, already a friend, adds a device
                if (theirDevice != null) {
                    document.getElementById(`devices`).innerHTML += createHTMLEntry(theirID);


                    ref.child(`users`).child(theirID).child(`device`)
                        .child(`current`).on(`child_added`, function (snapshot) {

                            addPoint(snapshot, theirID, map);

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

let askFriend = () => {

    let friendEmail = document.getElementById(`friend`).value;

    ref.child(`users`).orderByChild(`email`).equalTo(friendEmail).once(`value`, function(snapshot) {

        if(snapshot.exists()){
            let theirID = Object.keys(snapshot.val())[0];

            ref.child(`friend_requests`).child(theirID).child(userID)
            .set({"request_type": "received"});

            ref.child(`friend_requests`).child(userID).child(theirID)
            .set({"request_type": "sent"});

        } else {

            alert(`Invalid email`);

        }

    });

};

let confirmFriend = (theirID) => {

    let currentTime = Date.now();

    // Pushing data to friends data
    ref.child(`friend_data`).child(theirID).update(
        {[userID]: currentTime}
    );

    ref.child(`friend_data`).child(userID).update(
        {[theirID]: currentTime}
    );

    ref.child(`friend_requests`).child(userID).child(theirID).remove();
    ref.child(`friend_requests`).child(theirID).child(userID).remove();

    let element = document.getElementById(`friend` + theirID);
    element.parentNode.removeChild(element);

};
