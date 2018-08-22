
firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        // If user is authenticated create HTTP cookie
        if (user.emailVerified){
            $.ajax({
                'url' : '/cookies/verified/create/',
                'type' : 'GET',
                'success' : function() {
                    //console.log(`Created cookie`);
                    window.location.replace(`/`);

                },
                'error' : function() {
                    console.log(`Failed verify cookie`)
                }
            });
        }
        // Send email
        else {
            user.sendEmailVerification().then(function() {
                console.log(`Email send`)
            }, function(error) {
                // An error happened.
            });
        }
    }
});

// Sketchy log-out solution
document.getElementById(`logout`).addEventListener(`click`, function() {

    let uid;

    firebase.auth().onAuthStateChanged(function(user) {
        if (user){
            uid = user.uid
        }
    });

    firebase.auth().signOut().then(function() {

        $.ajax({

            'url' : '/cookies/delete/' + uid,
            'type' : 'GET',

            'success' : function(response, status, xhr) {
                window.location.replace(`/login/`);
            },
            'error' : function(request,error)
            {
                console.log(`error`)
            }
        });

    }, function(error) {
      // An error happened.
    });


});