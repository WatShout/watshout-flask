// Form handler for initial visit information input
let userID = document.getElementById(`uid`).getAttribute(`content`);
let userEmail;
let userName;

firebase.auth().onAuthStateChanged(function (user) {

    if (user) {

        userName = user.displayName;
        userEmail = user.email;

        ref.child("users").child(userID).once(`value`, function (snapshot) {

            if (snapshot.exists()) {

                window.location.href = `/`;

            }

        });

    }

});

let submitForm = () => {

    document.getElementById(`test`).innerHTML += `<img src="https://loading.io/spinners/fidget-spinner/lg.fidget-spinner.gif"/>`;

    document.getElementById(`error`).innerHTML = ``;


    let date = $('#age').val().split("-");

    let day = date[2];
    let month = date[1];
    let year = date[0];

    let birthday = month + "-" + day + "-" + year;

    console.log(birthday);

    let profilePic = $('#photo').get(0).files[0];

    let errorText = ``;

    if (age.length === 0) {
        errorText += `Please enter your age <br />`;
    }

    if (profilePic == null) {
        //errorText += `Please upload a photo <br />`;
    }

    if (errorText.length > 0) {
        document.getElementById(`error`).innerHTML = errorText;
        return;
    }

    let typeExtension;

    try {
        typeExtension = profilePic.type.split(`/`)[1].toLowerCase();

        if (typeExtension !== `png` && typeExtension !== `jpg` && typeExtension !== `jpeg`) {
            alert(`Wrong image format!`);
            return;
        }
    } catch (e) {

        typeExtension = `jpg`;

    }

    //ref.child(`users`).child(userID).child(`profile_pic_format`).set(typeExtension);

    let uploadTask;

    if (profilePic == null){
        fetch(`https://raw.githubusercontent.com/WatShout/watshout-flask/master/static/res/default_profile_pic.jpg?token=ADRBh0YrJ5ow-uuqWk1gEmwcU8rFzfEBks5bY3evwA%3D%3D`)
            .then(res => res.blob()) // Gets the response and returns it as a blob
            .then(blob => {
                // Here's where you get access to the blob
                // And you can use it for whatever you want
                // Like calling ref().put(blob)

                // Here, I use it to make an image appear on the page
                typeExtension = `jpg`;
                console.log(`test`);
                profilePic = blob;

                let metadata = {contentType: `image/` + typeExtension};
                const name = `profile.` + typeExtension;

                let thisReference = storageRef.child(`users`).child(userID).child(name);

                ref.child(`users`).child(userID).update({
                    "profile_pic_format": typeExtension,
                    "name": userName,
                    "birthday": String(birthday),
                    "email": userEmail
                });

                console.log(profilePic);
                uploadTask = thisReference.put(profilePic, metadata);

                uploadTask.on('state_changed', function(snapshot){
                    // Observe state change events such as progress, pause, and resume
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');

                    document.getElementById(`progress`).innerHTML = progress;

                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            console.log('Upload is paused');
                            console.log(progress);
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            console.log('Upload is running');
                            console.log(progress);
                            break;
                    }
                }, function(error) {
                    // Handle unsuccessful uploads
                }, function() {
                    // Handle successful uploads on complete
                    // For instance, get the download URL: https://firebasestorage.googleapis.com/...

                    location.href = `/`;


                });

            });
    } else {

        let metadata = {contentType: profilePic.type};
        const name = `profile.` + typeExtension;

        let thisReference = storageRef.child(`users`).child(userID).child(name);

        ref.child(`users`).child(userID).update({
            "profile_pic_format": typeExtension,
            "name": userName,
            "birthday": String(birthday),
            "email": userEmail
        });

        console.log(profilePic);
        uploadTask = thisReference.put(profilePic, metadata);

        uploadTask.on('state_changed', function(snapshot){
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');

            document.getElementById(`progress`).innerHTML = progress;

            switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                    console.log('Upload is paused');
                    console.log(progress);
                    break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                    console.log('Upload is running');
                    console.log(progress);
                    break;
            }
        }, function(error) {
            // Handle unsuccessful uploads
        }, function() {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...

            location.href = `/`;


        });


    }


};