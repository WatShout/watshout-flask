
/*

    Filename: strava-auth-check.js

    Purpose: Makes sure the user requesting the Strava integration is the same user that is
            currently logged in

    Associated HTML: strava-authorized.html

 */

let myUID = document.getElementById(`uid`).getAttribute(`content`);
let stravaToken = document.getElementById(`token`).getAttribute(`content`);

ref.child(`users`).child(myUID).child(`strava_token`).set(stravaToken)
    .then(function() {

        window.location.replace(`/me/`);

    });
