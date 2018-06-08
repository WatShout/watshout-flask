
let getTheirUID = () => document.getElementById(`uid`).getAttribute(`content`);
let theirUID = getTheirUID();

firebase.auth().onAuthStateChanged(function(user) {

    if (user){

        const myUID = user.uid;

        if (myUID === theirUID){

            document.getElementById(`logout`).innerText = user.email;

            document.getElementById(`profile`).href = `/users/` + myUID + `/`;
            document.getElementById(`friends`).href = `/users/` + myUID + `/friends/`;

        } else {
            alert(`You can only view your own friends page (for now)`);
            window.location.href = `/`;
        }

    }


    else {

        alert(`You aren't even logged in!`);
        window.location.href = `/login/`;

    }


});

