
/*

    Filename: config.js

    Purpose: Authenticates Firebase

    Associated HTML: every Firebase-related file

 */

let config = {
    apiKey: "AIzaSyDyP50TBSm5yugoczwXY4tXpJ_KMtP5Djo",
    authDomain: "watshout-test.firebaseapp.com",
    databaseURL: "https://watshout-test.firebaseio.com",
    projectId: "watshout-test",
    storageBucket: "gs://watshout-test.appspot.com",
    messagingSenderId: "644503016905"
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


