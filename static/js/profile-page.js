/*

    Filename: profile-page.js

    Purpose: Displays information about another user (with data retrieved from
            Firebase) using a Jinja2 template

    Associated HTML: templates/user_page.html

 */

firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        let myUID = user.uid;
        let theirID = getTheirUID();

        ref.child(`friend_data`).child(theirID).child(myUID).once('value', function(snapshot) {

            // If snapshot doesn't exist, then users are not friends
            if (!snapshot.exists()){

                alert(`You are not friends with this user`);

                window.history.back();

            }

        });


    } else {

        window.location.replace(`/login/`);

    }
});

let goBack = () => window.location.replace(`/app/`);

let getTheirUID = () => {

    return document.getElementById(`uid`).getAttribute(`content`);

};