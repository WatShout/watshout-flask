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

    thisReference.put(profilePic, metadata)
        .then(function () {

            ref.child(`users`).child(userID).update({
                "name": userName,
                "age": parseInt(age),
                "email": userEmail
            }).then(function () {
                location.href = `/`;
            })
        })
};