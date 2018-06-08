
let getTheirUID = () => document.getElementById(`uid`).getAttribute(`content`);
let theirUID = getTheirUID();

firebase.auth().onAuthStateChanged(function(user) {

    console.log(user);

    if (user){

        const myUID = user.uid;

        if (myUID === theirUID){

            // URL fixing (WIP)
            /*
            let currentURL = window.location.href;
            let newURL = currentURL.replace(myUID, `me`);
            history.replaceState(null, null, newURL);
            */

            document.getElementById(`logout`).innerText = user.email;
            document.getElementById(`profile`).href = `/users/` + myUID + `/`;
            document.getElementById(`settings`).href = `/users/` + myUID + `/settings/`;


        } else {
            alert(`You can only view your own friends page (for now)`);
            window.location.href = `/`;
        }

    }


    else {

        /*
        alert(`You aren't even logged in!`);
        window.location.href = `/login/`;
        */

    }


});

