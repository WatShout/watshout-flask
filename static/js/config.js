
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
  storageBucket: "",
  messagingSenderId: "572143736497"
};
firebase.initializeApp(config);

const database = firebase.database();
const ref = database.ref();


let signOut = () => {
    firebase.auth().signOut().then(function() {

        window.location.replace(`/login/`);

    }, function(error) {
      // An error happened.
    });
};


