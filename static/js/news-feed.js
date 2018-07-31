firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        let browserUID = user.uid;
        let serverUID = document.getElementById(`uid`).getAttribute(`content`);

        checkIfCookieAltered(browserUID, serverUID);

    }
});