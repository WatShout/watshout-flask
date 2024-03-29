
/*

    Filename: login.js

    Purpose: Uses FirebaseUI to provide Google and email login.
            Once user is authenticated they are redirected to
            /app/

    Associated HTML: login.html

 */


// FirebaseUI config.
let uiConfig = {

    // Goes to main app upon auth confirmation
    signInSuccessUrl: `/`,
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],

    // Terms of service url.
    tosUrl: ''
};

// Initialize the FirebaseUI Widget using Firebase.
let ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.start('#firebaseui-auth-container', uiConfig);

let initApp = () => {

    // Listening for auth state changes.
    firebase.auth().onAuthStateChanged(function(user) {

        if (user) {

            let uid = user.uid;
            let email = user.email;

            $.ajax({


                'url' : '/api/authorized/',
                'type' : 'POST',
                'data': {email: email},

                'success' : function(data) {
                    let obj = JSON.parse(data);
                    let auth = obj["success"];

                    if (!auth){
                        alert("Watshout is currently in a closed beta. You will now be redirected so you can"
                        + " apply to be part of it");
                        window.location.replace("https://watshout.com/whitelist/");

                        ref.child("users").child(uid).remove();
                        firebase.auth().currentUser.delete();



                    } else {
                        // If the user is already verified then we first create the 'verified' cookie.
                        // After the 'verified' cookie is received, we create the 'uid' cookie. After that
                        // is received we redirect to the main web app
                        if (user.emailVerified){

                            $.ajax({

                                'url' : '/cookies/verified/create/',
                                'type' : 'GET',

                                'success' : function() {

                                    $.ajax({

                                        'url' : '/cookies/uid/create/' + uid,
                                        'type' : 'GET',

                                        'success' : function() {
                                            console.log(`Created both cookies`);
                                            window.location.replace(`/`);
                                        },
                                        'error' : function() {
                                            console.log(`Verified, but failed UID cookie`)
                                        }
                                    });

                                },
                                'error' : function() {
                                    console.log(`Failed verify cookie`)
                                }
                            });

                        }

                        // User is not verified. Their 'uid' cookie is created but they will need to follow instructions
                        // to email verify their account. This process takes place on the main webapp page
                        else {
                            $.ajax({

                                'url' : '/cookies/uid/create/' + uid,
                                'type' : 'GET',

                                'success' : function() {
                                    console.log(`success`);
                                    window.location.replace(`/initialize/`);
                                },
                                'error' : function() {
                                    console.log(`Created UID cookie only`)
                                }
                            });
                        }
                    }

                },
                'error' : function(e) {
                    console.log(e);
                }

            });


        }
    });
};

window.onload = function() {
    initApp();
};
