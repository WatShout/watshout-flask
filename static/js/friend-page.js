
let getTheirUID = () => document.getElementById(`uid`).getAttribute(`content`);
let theirUID = getTheirUID();

firebase.auth().onAuthStateChanged(function(user) {

  if (user){

      let myUID = user.uid;

      document.getElementById(`profile`).href = `/users/` + myUID + `/`;
      document.getElementById(`friends`).href = `/users/` + myUID + `/friends/`;


  }


  else {


  }


});

let signOut = () => {
    firebase.auth().signOut().then(function() {

        window.location.replace(`/login/`);

    }, function(error) {
      // An error happened.
    });
};

