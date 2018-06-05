firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        let loggedInUID = user.uid;
        let stravaRequestUID = document.getElementById(`uid`).getAttribute(`content`);

        let stravaToken = document.getElementById(`token`).getAttribute(`content`);

        console.log("Login: " + loggedInUID);
        console.log("Strava: " + stravaRequestUID);

        // User is allowed to connect Strava account
        if (loggedInUID === stravaRequestUID){

            ref.child(`users`).child(loggedInUID).child(`strava_token`).set(stravaToken);

            window.location.replace(`/users/` + loggedInUID);

        } else {


            console.log("Login: " + loggedInUID);
            console.log("Strava: " + stravaRequestUID);

            //alert(`You can't do that`);
            //window.history.back();
        }


    } else {

        alert(`User not logged in`);
        window.history.back();

    }
});