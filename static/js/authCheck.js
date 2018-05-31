firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

    } else {

        alert(`You must be signed in to view this content`);
        window.location.replace(`/login`);

    }
});