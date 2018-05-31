let goBack = () => window.location.replace(`/`);

firebase.auth().onAuthStateChanged(function(user) {

    if (user) {



    } else {

        window.location.replace(`/login`);

    }
});