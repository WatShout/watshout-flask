
let myUID = document.getElementById(`uid`).getAttribute(`content`);

// TODO: Require confirmation? Should this even be a feature...
let changeEmail = () => {

    let user = firebase.auth().currentUser;
    let uid = user.uid;
    let newEmail = document.getElementById(`newemail`).value;

    document.getElementById(`newemail`).value = ``;

    newEmail = newEmail.toLowerCase();

    user.updateEmail(newEmail).then(function() {

        document.getElementById(`currentemail`).innerHTML =
            `Current email: ` + newEmail;

        document.getElementById(`logout`).innerText = newEmail;

        ref.child(`users`).child(uid).child(`email`).set(newEmail);


    }).catch(function(error) {

        console.log(error);

    });

};

let changeProfilePic = () => {

    const profilePic = $('#photo').get(0).files[0];
    let oldName;

    if (profilePic != null){

        // This hopefully always grabs the file extension correctly
        const newTypeExtension = profilePic.type.split(`/`)[1].toLowerCase();

        if (newTypeExtension !== `png` && newTypeExtension !== `jpg` && newTypeExtension !== `jpeg`){
            alert(newTypeExtension + ` is not a supported format.`);
            return;
        }

        // First we get the file extension for the user's current (old) profile picture
        ref.child(`users`).child(myUID).child(`profile_pic_format`).once(`value`, function (snapshot) {

            const oldTypeExtension = snapshot.val();
            oldName = `profile.` + oldTypeExtension;

        })
            // After we get the old profile picture name we delete it
            .then(function () {

            const thisStorageRef = storageRef.child(`users`).child(myUID);

            thisStorageRef.child(oldName).delete()

            // After deleting, we upload the new picture
                .then(function() {

                const newName = `profile.` + newTypeExtension;
                const metadata = { contentType: profilePic.type };

                thisStorageRef.child(newName).put(profilePic, metadata)

                    // After uploading the picture we update their profile pic format DB entry
                    .then(function() {

                        ref.child(`users`).child(myUID).child(`profile_pic_format`).set(newTypeExtension);
                        console.log(`uploaded!`);

                })
            })
        });
    }
    else {
        alert(`No picture uploaded!`);
    }
};


let passwordReset = () => {

    let auth = firebase.auth();
    let user = auth.currentUser;
    let emailAddress = user.email;

    auth.sendPasswordResetEmail(emailAddress).then(function() {

        alert(`Email sent!`);

    }).catch(function(error) {

        console.log(error);

    });

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
    $('#myImg').attr('src', e.target.result);
};

