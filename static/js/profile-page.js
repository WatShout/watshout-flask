/*

    Filename: profile-page.js

    Purpose: Displays information about another user (with data retrieved from
            Firebase) using a Jinja2 template

    Associated HTML: templates/user_page.html

 */

let getTheirUID = () => document.getElementById(`uid`).getAttribute(`content`);

let theirUID = getTheirUID();

firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        let myUID = user.uid;


        ref.child(`friend_data`).child(theirUID).child(myUID).once('value', function(snapshot) {

            // If snapshot doesn't exist, then users are not friends
            if (!snapshot.exists() && theirUID !== myUID){

                alert(`You are not friends with this user`);

                window.history.back();

            } else {

                let timeInSeconds = snapshot.val() / 1000;

                let date = new Date(0);

                date.setUTCSeconds(timeInSeconds);

                document.getElementById(`since`).innerHTML =
                    `You have been friends since ` + date;
            }

        });


    } else {

        window.location.replace(`/login/`);

    }
});

let goBack = () => window.location.replace(`/app/`);

let activity_ids = document.getElementById(`activity_ids`).getAttribute(`content`);

let getActivityList = (linkString) => {

    // Removes whitespace
    linkString = linkString.replace(/ /g,'');

    // Removes [
    linkString = linkString.substring(1);

    // Removes ]
    linkString = linkString.slice(0, -1);

    // Creates an array of <a> tags </a>
    let array = linkString.split(',');

    // Removes the '' around each tag
    for (let i = 0; i < array.length; i++){
        array[i] = array[i].substring(1).slice(0, -1);
    }

    return array;

}

let addPreviousActivities = (activityArray) => {

    for (let i = 0; i < activityArray.length; i++){

        let name = activityArray[i];

        let html = `<div class="activity_container">`;

        let link = `/users/` + theirUID + `/activities/` + name;

        let current = `<a href="` + link + `">` + name + `</a><br />`;

        html += current + `</div>`;

        document.getElementById(`past`).innerHTML += html;

    }

}


addPreviousActivities(getActivityList(activity_ids));
