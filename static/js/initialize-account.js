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

    document.getElementById(`test`).innerHTML += `<div class="loader"></div>`;

    document.getElementById(`error`).innerHTML = ``;

    let age = document.getElementById(`age`).value;

    let profilePic = $('#photo').get(0).files[0];

    let errorText = ``;

    if (age.length === 0) {
        errorText += `Please enter your age <br />`;
    }

    if (profilePic == null) {
        errorText += `Please upload a photo <br />`;
    }

    if (errorText.length > 0) {
        document.getElementById(`error`).innerHTML = errorText;
        return;
    }

    const typeExtension = profilePic.type.split(`/`)[1].toLowerCase();

    if (typeExtension !== `png` && typeExtension !== `jpg` && typeExtension !== `jpeg`) {
        alert(`Wrong image format!`);
        return;
    }

    const name = `profile.` + typeExtension;
    const metadata = {contentType: profilePic.type};

    ref.child(`users`).child(userID).child(`profile_pic_format`).set(typeExtension);

    let thisReference = storageRef.child(`users`).child(userID).child(name);

    let uploadTask = thisReference.put(profilePic, metadata);

    uploadTask.on('state_changed', function(snapshot){
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
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

        ref.child(`users`).child(userID).update({
            "name": userName,
            "age": parseInt(age),
            "email": userEmail
        }).then(function () {
            location.href = `/`;
        })

    });

};