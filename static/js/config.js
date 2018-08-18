
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
const messaging = firebase.messaging();
messaging.usePublicVapidKey("BA1r_pl_s49QFivnrBTaOURnlpzPMsjUQUYei50wRrAEH9mirdgnb3AMPKodzov7lRKVn1DkxygfGV1yLABCQtA");

messaging.requestPermission().then(function() {
  console.log('Notification permission granted.');
  // TODO(developer): Retrieve an Instance ID token for use with FCM.
  // ...
}).catch(function(err) {
  console.log('Unable to get permission to notify.', err);
});

messaging.getToken().then(function(currentToken) {
  if (currentToken) {
    console.log(currentToken);
  } else {
    // Show permission request.
    console.log('No Instance ID token available. Request permission to generate one.');

  }
}).catch(function(err) {
  console.log('An error occurred while retrieving token. ', err);
});

// Callback fired if Instance ID token is updated.
messaging.onTokenRefresh(function() {
  messaging.getToken().then(function(refreshedToken) {
    console.log('Token refreshed.');
    console.log(refreshedToken);

  }).catch(function(err) {
    console.log('Unable to retrieve refreshed token ', err);
  });
});



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

