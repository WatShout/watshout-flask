
/*

    Filename: config.js

    Purpose: Authenticates Firebase

    Associated HTML: every Firebase-related file

 */

let config = {
  apiKey: "AIzaSyCEFFfLVU_lFaUt8bYL0E0zYtkeYsepU4A",
  authDomain: "watshout-app.firebaseapp.com",
  databaseURL: "https://watshout-app.firebaseio.com",
  projectId: "watshout-app",
  storageBucket: "gs://watshout-app.appspot.com",
  messagingSenderId: "572143736497"
};
firebase.initializeApp(config);

const database = firebase.database();
const ref = database.ref();
const storageRef = firebase.storage().ref();

let signOut = () => {

    //console.log(firebase.auth().currentUser.uid);

    let uid;

    firebase.auth().onAuthStateChanged(function(user) {
        if (user){
            uid = user.uid
        }
    });

    firebase.auth().signOut().then(function() {

        $.ajax({

            'url' : '/cookies/delete/' + uid,
            'type' : 'GET',

            'success' : function(response, status, xhr) {
                window.location.replace(`/login/`);
            },
            'error' : function(request,error)
            {
                console.log(`error`)
            }
        });

    }, function(error) {
      // An error happened.
    });
};


