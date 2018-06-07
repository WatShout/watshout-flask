
let myUID;

let getFriendRequests = () => {


    ref.child(`friend_requests`).child(myUID).orderByChild(`request_type`).equalTo(`received`).on(`child_added`, function (snapshot) {

        // snapshot.key has ID

    });

};

let getFriendsList = () => {

    ref.child(`friend_data`).child(myUID).on(`child_added`, function (snapshot) {

        // snapshot.key has ID

    })

};

firebase.auth().onAuthStateChanged(function(user) {

  if (user){

      myUID = user.uid;

      document.getElementById(`logout`).innerText = user.uid;

      getFriendRequests();
      getFriendsList();



  }


  else {


  }


});


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

let confirmFriend = (theirID) => {

    let currentTime = Date.now();

    // Pushing data to friends data
    ref.child(`friend_data`).child(theirID).update(
        {[myUID]: currentTime}
    );

    ref.child(`friend_data`).child(myUID).update(
        {[myUID]: currentTime}
    );

    ref.child(`friend_requests`).child(myUID).child(theirID).remove();
    ref.child(`friend_requests`).child(theirID).child(myUID).remove();

    let element = document.getElementById(theirID);
    element.parentNode.removeChild(element);

    document.getElementById(`accepted`).innerHTML += theirID;

};

