
/*

    Filename: main.js

    Purpose: Provide functions for interacting with friends list while on
            the main webapp page (/app/)

    Associated HTML: main_app.html

 */


// These pertain to the currently logged-in user
let userID;
let userEmail;

let globalUser;

let openNav = () => {
    document.getElementById(`myNav`).style.width = `100%`;
};

let closeNav = () => {
    document.getElementById(`myNav`).style.width = `0%`;
};


let resizeImage = (img) => {

    let preferredWidth = 1920;
    let ratio = preferredWidth / img.naturalWidth;

    let canvas = $(`<canvas>`)[0];
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;

    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0,0,canvas.width, canvas.height);

    return String(canvas.toDataURL());

};

function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

let submitForm = () => {

    document.getElementById(`error`).innerHTML = ``;

    let age = document.getElementById(`age`).value;

    let profilePic = $('#photo').get(0).files[0];

    let errorText = ``;

    if (age.length === 0){
        errorText += `Please enter your age <br />`;
    }

    if (profilePic == null){
        errorText += `Please upload a photo <br />`;
    }

    if (errorText.length > 0){
        document.getElementById(`error`).innerHTML = errorText;
        return;
    }

    const typeExtension = profilePic.type.split(`/`)[1].toLowerCase();

    if (typeExtension !== `png` && typeExtension !== `jpg` && typeExtension !== `jpeg`){
        alert(`Wrong image format!`);
        return;
    }

    const name = `profile.` + typeExtension;
    const metadata = { contentType: profilePic.type };

    ref.child(`users`).child(globalUser.uid).child(`profile_pic_format`).set(typeExtension);

    let thisReference = storageRef.child(`users`).child(globalUser.uid).child(name);

    thisReference.put(profilePic, metadata)
        .then(function () {

            document.getElementById(`logout`).innerHTML = globalUser.email;

            ref.child(`users`).child(globalUser.uid).update({
                "name": globalUser.displayName,
                "age": parseInt(age),
                "email": globalUser.email
            }).then(function () {
                closeNav();
            })
        })
};


firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        globalUser = user;

        userID = user.uid;
        userEmail = user.email;

        let hasInfo = document.getElementById(`has_info`).getAttribute(`content`);

        if (!user.emailVerified){

            user.sendEmailVerification().then(function() {

                console.log(`Email sent`);

            }, function(error) {
                // An error happened.
            });

        } else {

            $.ajax({

                'url' : '/cookies/verified/create/',
                'type' : 'GET',

                'success' : function() {
                    //console.log(`Created cookie`);
                },
                'error' : function() {
                    console.log(`error`)
                }
            });

        }

        if (hasInfo === `no`){
            openNav();
        }

    } else {

        window.location.href = "/login/";

    }


    // Plots current paths by all friends
    ref.child(`friend_data`).child(userID).on(`child_added`, function(snapshot) {

        let theirUID = snapshot.key;

        deviceDict[theirUID] = [];

        storageRef.child("users").child(theirUID).child("profile.png").getDownloadURL()
            .then(function (url) {

                theirProfilePics[theirUID] = url;

                // For each friend currently in an activity this plots all the points
                // made up to the point the web page was loaded
                ref.child(`users`).child(theirUID).once(`value`, function(snapshot) {

                    let theirName = snapshot.val()[`name`];
                    let theirEmail = snapshot.val()[`email`];
                    let theirDevice = snapshot.val()[`device`];

                    // TODO: console.log(snapshot.val()[`device`]);

                    // TODO: Fix behavior when a user, already a friend, adds a device
                    if (theirDevice != null) {
                        document.getElementById(`devices`).innerHTML +=

                            createHTMLEntry(theirName, theirUID, theirEmail);

                        ref.child(`users`).child(theirUID).child(`device`)
                            .child(`current`).on(`child_added`, function (snapshot) {

                            addPoint(snapshot, theirUID, map);
                            createLine(deviceDict[theirUID], map);

                            // This should fail when the user is currently tracking
                            try {
                                document.getElementById(`not-tracking` + theirUID).innerHTML = ``;
                            } catch (TypeError){

                            }

                            changeHTMLTag(theirUID, `battery`, snapshot.val()[`battery`]);
                            changeHTMLTag(theirUID, `speed`, snapshot.val()[`speed`]);

                        });

                    }
                });

            });
    });
});


let createHTMLEntry = (theirName, theirUID, theirEmail) => {

    let html = `<div class="deviceinfo" id="` + theirUID + `">` +
        `<a href="` + `/users/` + theirUID + `">` + theirName + `</a>` + ` (` + theirEmail + `)` +
        `\n<div id="not-tracking` + theirUID + `">User is not tracking right now</div>` +
        `\n<div id="battery` + theirUID + `"></div>` +
        `\n<div id="speed` + theirUID + `"></div>` +
        `</div>`;

    return html;

};

let changeHTMLTag = (theirUID, label, value) => {

    let lower = label.toLowerCase();

    let newValue = label + ": " + value;

    try{
        document.getElementById(lower + theirUID).innerHTML = newValue;
    } catch(TypeError){
        //createHTMLEntry(id);
        //document.getElementById(lower + id).innerHTML = newValue;
    }
};

// These handle displaying the selected image on the screen
$(function () {
    $(":file").change(function () {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = imageIsLoaded;
            reader.readAsDataURL(this.files[0]);
        }
    });
});

let imageIsLoaded = (e) => {

    document.getElementById(`myImg`).src = e.target.result;



};
