
/*

    Filename: login.js

    Purpose: Uses FirebaseUI to provide Google and email login.
            Once user is authenticated they are redirected to
            /app/

    Associated HTML: login.html

 */


// FirebaseUI config.
let uiConfig = {

    signInSuccessUrl: `/app/`,
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],

    // Terms of service url.
    tosUrl: ''
};

// Initialize the FirebaseUI Widget using Firebase.
let ui = new firebaseui.auth.AuthUI(firebase.auth());

// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);

let initApp = () => {

    // Listening for auth state changes.
    firebase.auth().onAuthStateChanged(function(user) {

        if (user) {

            // User is signed in (signInSuccessUrl is used)

            window.location.replace(`/app/`);

        }
    });
};

window.onload = function() {
    initApp();
};
