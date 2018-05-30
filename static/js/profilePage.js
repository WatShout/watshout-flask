let goBack = () => window.location.replace(`/`);

firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        // User is authenticated

    } else {

        window.location.replace(`/login`);

    }
});