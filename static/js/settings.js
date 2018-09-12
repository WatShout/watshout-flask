let month=new Array(12);
        month[0]="January";
        month[1]="February";
        month[2]="March";
        month[3]="April";
        month[4]="May";
        month[5]="June";
        month[6]="July";
        month[7]="August";
        month[8]="September";
        month[9]="October";
        month[10]="November";
        month[11]="December";

let currentUser;
let firstName;
let lastName;
let birthYear;
let birthMonth;
let birthDay;

let heightFeet = null;
let heightInches = null;
let weight = null;
let gender = null;

let uid;

firebase.auth().onAuthStateChanged(function (user) {

    if (user) {

        uid = user.uid;
        console.log(uid);

        currentUser = user;

        let name = user.displayName;
        let nameList = name.split(" ");

        firstName = nameList[0];
        lastName = nameList[1];

        console.log(user.providerData[0].providerId);

        for (let i = 2; i < nameList.length; i++) {
            lastName += `, ` + nameList[i];
        }

        document.getElementById(`first-name-input`).value = firstName;
        document.getElementById(`last-name-input`).value = lastName;

        document.getElementById(`my-name`).innerHTML = firstName + ` ` + lastName;

        birthYear = document.getElementById(`birth-year`).getAttribute(`content`);
        birthMonth = document.getElementById(`birth-month`).getAttribute(`content`);
        birthDay = document.getElementById(`birth-day`).getAttribute(`content`);

        try {
            heightFeet = document.getElementById(`height-feet`).getAttribute(`content`);
            document.getElementById(`height-foot-input`).value = heightFeet;
        } catch (e) {}
        try {
            heightInches = document.getElementById(`height-inches`).getAttribute(`content`);
            document.getElementById(`height-inch-input`).value = heightInches;
        } catch (e) {}
        try {
            weight = document.getElementById(`weight`).getAttribute(`content`);
            document.getElementById(`weight-input`).value = weight;
        } catch (e) {}
        try {
            gender = document.getElementById(`gender`).getAttribute(`content`);
            document.getElementById(`gender-input`).value = gender;
        } catch (e) {}

        document.getElementById(`birthday-year-input`).value = birthYear;
        document.getElementById(`month-input`).value = month[birthMonth - 1];
        document.getElementById(`day-input`).value = birthDay;


    } else {
        window.location.href = "/login/";
    }
});

let getName = () => {
    let firstName = document.getElementById(`first-name-input`).value;
    let lastName = document.getElementById(`last-name-input`).value;

    return firstName + ` ` + lastName;
};

let getBirthday = () => {

    let dateHash = {
        January : 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12
       };

    let currentBirthYear = document.getElementById(`birthday-year-input`).value;
    let currentBirthMonth = document.getElementById(`month-input`).value;
    let currentBirthDay = document.getElementById(`day-input`).value;

    return  + dateHash[currentBirthMonth] + `-` + currentBirthDay + `-` + currentBirthYear;
};

let saveData = () => {

    let userRef = ref.child(`users`).child(uid);

    let currentFirstName = document.getElementById(`first-name-input`).value;
    let currentLastName = document.getElementById(`last-name-input`).value;
    let currentGender = document.getElementById(`gender-input`).value;
    let currentBirthYear = document.getElementById(`birthday-year-input`).value;
    let currentBirthMonth = document.getElementById(`month-input`).value;
    let currentBirthDay = document.getElementById(`day-input`).value;
    let currentHeightFeet = document.getElementById(`height-foot-input`).value;
    let currentHeightInches = document.getElementById(`height-inch-input`).value;
    let currentWeight = document.getElementById(`weight-input`).value;

    if (currentGender !== gender) {
        userRef.child(`gender`).set(currentGender);
    }

    if (currentWeight !== weight) {
        userRef.child(`weight`).set(currentWeight);
    }

    if (currentHeightFeet !== heightFeet) {
        userRef.child(`height-feet`).set(currentHeightFeet);
    }

    if (currentHeightInches !== heightInches) {
        userRef.child(`height-inches`).set(currentHeightInches);
    }

    if (currentFirstName !== firstName || currentLastName !== lastName) {
        currentUser.updateProfile({
            displayName: getName()
        })
    }

    if (currentBirthYear !== birthYear ||
        currentBirthMonth !== birthMonth ||
        currentBirthDay !== birthDay) {
        userRef.child(`birthday`).set(getBirthday());
    }


};

let resetPassword = () => {
    firebase.auth().sendPasswordResetEmail(currentUser.email);
    alert(`Instructions to reset your password have been emailed to ` + currentUser.email);
};

let changeEmail = () => {
    alert(`Feature coming soon!`);
};

let changeProfilePic = () => {
    alert(`Feature coming soon!`);
};