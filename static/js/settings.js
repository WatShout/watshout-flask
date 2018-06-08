
let getTheirUID = () => document.getElementById(`uid`).getAttribute(`content`);

let theirUID = getTheirUID();

let myUID;

firebase.auth().onAuthStateChanged(function(user) {

    // Initializes the Google Map.
    if (user) {

        myUID = user.uid;

        if (myUID === theirUID) {

            document.getElementById(`logout`).innerText = user.email;

            document.getElementById(`home`).href = `/`;
            document.getElementById(`profile`).href = `/users/` + myUID;
            document.getElementById(`friends`).href = `/users/` + myUID + `/friends/`;


        }

    }

    else {

    }


});


let changeEmail = () => {

    let user = firebase.auth().currentUser;
    let newEmail = document.getElementById(`newemail`).value;

    user.updateEmail(newEmail).then(function() {

        document.getElementById(`currentemail`).innerHTML =
            `Current email: ` + newEmail;

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