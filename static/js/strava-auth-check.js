firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        let loggedInUID = user.uid;
        let stravaRequestUID = document.getElementById(`uid`).getAttribute(`content`);

        let stravaToken = document.getElementById(`token`).getAttribute(`content`);

        // User is allowed to connect Strava account
        if (loggedInUID === stravaRequestUID){

            ref.child(`users`).child(loggedInUID).child(`strava_token`).set(stravaToken);

        } else {

                alert(`You can't do that`);
                window.history.back();
        }


    } else {

        alert(`User not logged in`);
        window.history.back();

    }
});