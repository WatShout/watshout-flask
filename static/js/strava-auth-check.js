
/*

    Filename: strava-auth-check.js

    Purpose: Makes sure the user requesting the Strava integration is the same user that is
            currently logged in

    Associated HTML: strava-authorized.html

 */

firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        let loggedInUID = user.uid;

        let stravaRequestUID = document.getElementById(`uid`).getAttribute(`content`);
        let stravaToken = document.getElementById(`token`).getAttribute(`content`);

        console.log(loggedInUID);
        console.log(stravaRequestUID);

        // User is allowed to connect Strava account
        if (loggedInUID === stravaRequestUID){

            ref.child(`users`).child(loggedInUID).child(`strava_token`).set(stravaToken);
            window.location.replace(`/users/` + loggedInUID);

        }

        // Someone else is trying to link their Strava account
        else {

            alert(`You can only link your own Strava account`);
            window.location.replace(`/`);

        }


    } else {

        alert(`You aren't logged into WatShout!`);
        window.location.replace(`/login/`);

    }
});
