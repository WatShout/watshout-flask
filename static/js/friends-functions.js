
let myUID;

firebase.auth().onAuthStateChanged(function(user) {

    if (user){

        myUID = user.uid;

        getFriendRequests();
        getFriendsList();

    }
});

let removeChild = (id) => {
    let element = document.getElementById(id);
    element.parentNode.removeChild(element);
};

let getFriendRequests = () => {


    ref.child(`friend_requests`).child(myUID).orderByChild(`request_type`).equalTo(`received`).on(`child_added`, function (snapshot) {

        const theirUID = snapshot.key;

        ref.child(`users`).child(theirUID).child(`email`).once(`value`, function (snapshot) {

            theirEmail = snapshot.val();

            let confirmLink = `<a id="` + theirUID + `" href="#" onclick="confirmFriend('` + theirUID + `')">` + theirEmail + `</a>`;

            document.getElementById(`pending`).innerHTML += confirmLink + `<br />`;

        });

    });

    ref.child(`friend_requests`).child(myUID).orderByChild(`request_type`).equalTo(`received`).on(`child_removed`, function (snapshot) {

        let theirUID = snapshot.key;

        removeChild(theirUID);

    });


};

let getFriendsList = () => {

    ref.child(`friend_data`).child(myUID).on(`child_added`, function (snapshot) {

        let theirUID = snapshot.key;

        ref.child(`users`).child(theirUID).child(`email`).once(`value`, function (snapshot) {

            theirEmail = snapshot.val();

            let emailHTML = `<a id="` + theirUID + `" href="#">` + theirEmail + `</a>`;

            // This should only 'work' on the friends page
            try {
                document.getElementById(`accepted`).innerHTML += emailHTML + `<br />`;
            } catch (TypeError){

            }

        });
    });

    ref.child(`friend_data`).child(myUID).on(`child_removed`, function (snapshot) {

        let theirUID = snapshot.key;

        removeChild(theirUID);

    });

};


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

