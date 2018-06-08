
let myUID = document.getElementById(`uid`).getAttribute(`content`);

let changeEmail = () => {

    let user = firebase.auth().currentUser;
    let uid = user.uid;
    let newEmail = document.getElementById(`newemail`).value;

    user.updateEmail(newEmail).then(function() {

        document.getElementById(`currentemail`).innerHTML =
            `Current email: ` + newEmail;

        document.getElementById(`logout`).innerText = newEmail;

        ref.child(`users`).child(uid).child(`email`).set(newEmail);


    }).catch(function(error) {

        console.log(error);

    });

};

let passwordReset = () => {

    let auth = firebase.auth();
    let user = auth.currentUser;
    let emailAddress = user.email;

    auth.sendPasswordResetEmail(emailAddress).then(function() {
      // Email sent.
    }).catch(function(error) {

        console.log(error);

    });

};