
let myUID;

firebase.auth().onAuthStateChanged(function(user) {

  if (user){

      myUID = user.uid;


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

