
// Gets the current user's ID from the meta tag in Jinja2
let myUID = document.getElementById(`uid`).getAttribute(`content`);

// Removes a child from the DOM
let removeChild = (id) => {
    let element = document.getElementById(id);
    element.parentNode.removeChild(element);
};

// Populates the 'pending' friend request list
let getFriendRequests = () => {

    // User has pending friend requests
    ref.child(`friend_requests`).child(myUID).orderByChild(`request_type`).equalTo(`received`).on(`child_added`, function (snapshot) {

        const theirUID = snapshot.key;

        ref.child(`users`).child(theirUID).child(`email`).once(`value`, function (snapshot) {
            theirEmail = snapshot.val();
            let confirmLink = `<a id="` + theirUID + `" href="#" onclick="confirmFriend('` + theirUID + `')">` + theirEmail + `</a>`;
            document.getElementById(`pending`).innerHTML += confirmLink + `<br />`;

        });
    });

    // If friend request to user is revoked
    ref.child(`friend_requests`).child(myUID).orderByChild(`request_type`).equalTo(`received`).on(`child_removed`, function (snapshot) {

        let theirUID = snapshot.key;
        removeChild(theirUID);

    });

};

let getFriendsList = () => {

    ref.child(`friend_data`).child(myUID).on(`child_added`, function (snapshot) {

        let theirUID = snapshot.key;

        ref.child(`users`).child(theirUID).child(`email`).once(`value`, function (snapshot) {

            let theirEmail = snapshot.val();

            document.getElementById(`accepted`).innerHTML += theirEmail + `<br />`;

        });
    });

    ref.child(`friend_data`).child(myUID).on(`child_removed`, function (snapshot) {

        let theirUID = snapshot.key;

        removeChild(theirUID);

    });

};

// Sends a friend request
let askFriend = () => {

    let friendEmail = document.getElementById(`search`).value;

    ref.child(`users`).orderByChild(`email`).equalTo(friendEmail).once(`value`, function(snapshot) {

        if(snapshot.exists()){
            let theirID = Object.keys(snapshot.val())[0];

            ref.child(`friend_requests`).child(theirID).child(myUID)
                .set({"request_type": "received"});

            ref.child(`friend_requests`).child(myUID).child(theirID)
                .set({"request_type": "sent"});

        } else {

            alert(`Invalid email`);

        }

    });

};

// Happens when user clicks on pending friend request link
let confirmFriend = (theirUID) => {

    let currentTime = Date.now();

    // Pushing data to friends data
    ref.child(`friend_data`).child(theirUID).update(
        {[myUID]: currentTime}
    );

    ref.child(`friend_data`).child(myUID).update(
        {[theirUID]: currentTime}
    );

    ref.child(`friend_requests`).child(myUID).child(theirUID).remove();
    ref.child(`friend_requests`).child(theirUID).child(myUID).remove();

};

getFriendRequests();
getFriendsList();