

firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

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
        else {
            user.sendEmailVerification().then(function() {
                console.log(`Email send`)
            }, function(error) {
                // An error happened.
            });
        }

    }

});