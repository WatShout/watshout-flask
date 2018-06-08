
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

        } else {

            console.log("Login: " + loggedInUID);
            console.log("Strava: " + stravaRequestUID);

            document.getElementById(`text`).innerText = `<p>Something went wrong!</p>`;

        }


    } else {

        alert(`User not logged in`);
        window.location.replace(`/login/`);

    }
});
