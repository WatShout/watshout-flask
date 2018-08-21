
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {

        let addToDatabase = () => {

            let email = document.getElementById(`email`).value.toLowerCase();

            document.getElementById(`email`).value = ``;

            ref.child("whitelisted_emails").push({
                email: email
            })
        };

    }
});



let populateEmailList = () => {

    ref.child("whitelisted_emails").on(`child_added`, function (snapshot) {

        document.getElementById(`approved`).innerHTML += `<br />` + snapshot.val()[`email`];

    });
};

populateEmailList();
