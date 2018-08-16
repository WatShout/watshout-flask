
/*

    Filename: config.js

    Purpose: Authenticates Firebase

    Associated HTML: every Firebase-related file

 */

let config = {
    apiKey: "AIzaSyDgoFIn4pMSsadqDj5adc8V58Ct_MeNjmU",
    authDomain: "watshout-cloud.firebaseapp.com",
    databaseURL: "https://watshout-cloud.firebaseio.com",
    projectId: "watshout-cloud",
    storageBucket: "watshout-cloud.appspot.com",
    messagingSenderId: "107414838661"
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

let checkIfCookieAltered = (browser, server) => {

    if (browser.trim() !== server.trim()) {

        signOut();
    }

};

