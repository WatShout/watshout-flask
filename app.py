from flask import Flask, render_template, Markup, request, redirect, url_for, make_response
from stravalib.client import Client

import pyrebase

client = Client()
access_token = None

app = Flask(__name__, static_url_path="/static")

# Note: Everything is authenticated because of the service account
config = {
    "apiKey": "AIzaSyCEFFfLVU_lFaUt8bYL0E0zYtkeYsepU4A",
    "authDomain": "watshout-app.firebaseapp.com",
    "databaseURL": "https://watshout-app.firebaseio.com",
    "projectID": "watshout-app",
    "storageBucket": "",
    "serviceAccount": "serviceAccountCredentials.json"
}

firebase = pyrebase.initialize_app(config)

# Get a reference to the database service
ref = firebase.database()

DEBUG = False


@app.route('/')
def main_map():
    my_uid = request.cookies.get('uid')
    if my_uid is None:
        return redirect(url_for('login'))

    verified = request.cookies.get('verified')
    if verified is None:
        return render_template('email-verify.html', uid=my_uid)

    my_email = ref.child("users").child(my_uid).child("email").get().val()

    return render_template('main-app.html', uid=my_uid, my_email=my_email)


@app.route('/cookies/verified/create/')
def create_verification_cookie():
    res = make_response()
    res.set_cookie('verified', 'true', max_age=60 * 60 * 24 * 7 * 365)
    return res


@app.route('/cookies/uid/create/<string:uid>')
def create_uid_cookie(uid=None):
    res = make_response()
    res.set_cookie('uid', uid, max_age=60 * 60 * 24 * 7 * 365)
    return res


@app.route('/cookies/delete/<string:uid>')
def delete_uid_cookie(uid=None):
    res = make_response()
    res.set_cookie('uid', uid, max_age=0)
    res.set_cookie('verified', 'true', max_age=0)
    return res


@app.route('/login/')
def login():
    return app.send_static_file('login.html')


@app.route('/me/strava/login/')
def strava_login():

    my_uid = request.cookies.get('uid')
    if my_uid is None:
        return redirect(url_for('login'))

    verified = request.cookies.get('verified')
    if verified is None:
        return render_template('email-verify.html', uid=my_uid)

    if not DEBUG:
        uri = 'https://watshout.herokuapp.com/me/strava/authorized/'
    else:
        uri = 'http://127.0.0.1:5000/me/strava/authorized/'

    authorize_url = None
    if not access_token:
        authorize_url = client.authorization_url(
            client_id=26116,
            redirect_uri=uri,
            approval_prompt='auto',
            scope='view_private,write'
        )
        return redirect(authorize_url, code=302)


@app.route('/me/strava/authorized/')
def strava_authorized():
    code = request.args.get('code')

    my_uid = request.cookies.get('uid')
    if my_uid is None:
        return redirect(url_for('login'))

    verified = request.cookies.get('verified')
    if verified is None:
        return render_template('email-verify.html', uid=my_uid)

    access_token = client.exchange_code_for_token(
        client_id=26116,
        client_secret='04ba9a4ac548cdc94c375baf65ceb95eca3af533',
        code=code)

    client.access_token = access_token

    # client.upload_activity(test_run, 'gpx')

    return render_template('strava-authorized.html',
                           token=access_token,
                           uid=my_uid)


@app.route('/me/')
def my_page():

    my_uid = request.cookies.get('uid')
    if my_uid is None:
        return redirect(url_for('login'))

    verified = request.cookies.get('verified')
    if verified is None:
        return render_template('email-verify.html', uid=my_uid)

    # Try to display a simple page with user info
    try:
        email = ref.child("users").child(my_uid).get().val()['email']
        name = ref.child("users").child(my_uid).get().val()['name']
        age = ref.child("users").child(my_uid).get().val()['age']

    # If user isn't found in the database we assume they don't exist
    except TypeError:
        print("TypeError: User doesn't exist")
        return render_template('user_doesnt_exist.html', uid=my_uid)

    # Try to build a list of user's activities
    try:
        device = ref.child("users").child(my_uid).get().val()['device']['past']

        activity_ids = []

        # Gets the activity 'ID' and adds it to a list
        # (that is parsed as a string)
        for key, value in device.items():
            activity_ids.append(key)

    # User has no activities/devices
    except KeyError:
        activity_ids = ""
        print("KeyError: No activities")

    # Get the user's Strava auth token
    try:
        strava_token = ref.child("users").child(my_uid).get().val()['strava_token']

    # User hasn't authenticated with Strava
    except KeyError:
        strava_token = "no"
        print("KeyError: No Strava connection")

    return render_template('profile-page.html', email=email, name=name, age=age, uid=my_uid,
                           activity_ids=activity_ids, strava_token=strava_token)


@app.route('/me/friends/')
def my_friends():

    my_uid = request.cookies.get('uid')
    if my_uid is None:
        return redirect(url_for('login'))

    verified = request.cookies.get('verified')
    if verified is None:
        return render_template('email-verify.html', uid=my_uid)

    my_email = ref.child("users").child(my_uid).child("email").get().val()

    my_friends = ref.child("friend_data").child(my_uid).get().val()

    friend_links = []

    for their_uid in my_friends:
        their_email = ref.child("users").child(their_uid).child("email").get().val()
        link = '<a id="' + their_uid + '" href="/users/' + their_uid + '">' + their_email + '</a>'
        friend_links.append(link)

    return render_template('friends-page.html', uid=my_uid, my_email=my_email)


@app.route('/me/settings/')
def my_settings():

    my_uid = request.cookies.get('uid')
    if my_uid is None:
        return redirect(url_for('login'))

    verified = request.cookies.get('verified')
    if verified is None:
        return render_template('email-verify.html', uid=my_uid)

    email = ref.child("users").child(my_uid).child("email").get().val()

    return render_template('settings.html', uid=my_uid,
                           email=email)


@app.route('/users/<string:their_uid>/')
def user_page(their_uid=None):

    my_uid = request.cookies.get('uid')
    if my_uid is None:
        return redirect(url_for('login'))

    verified = request.cookies.get('verified')
    if verified is None:
        return render_template('email-verify.html', uid=my_uid)

    my_email = ref.child("users").child(my_uid).child("email").get().val()

    my_friends = ref.child("friend_data").child(my_uid).get().val()

    if their_uid in my_friends:

        email = ref.child("users").child(their_uid).get().val()['email']
        name = ref.child("users").child(their_uid).get().val()['name']
        age = ref.child("users").child(their_uid).get().val()['age']

        # Try to build a list of user's activities
        try:
            device = ref.child("users").child(their_uid).get().val()['device']['past']

            activity_ids = []

            # Gets the activity 'ID' and adds it to a list
            # (that is parsed as a string)
            for key, value in device.items():
                activity_ids.append(key)

        # User has no activities/devices
        except KeyError:
            activity_ids = ""
            print("KeyError: No activities")

        return render_template('profile-page.html', my_email=my_email, email=email, name=name, age=age, uid=their_uid,
                               activity_ids=activity_ids)
    else:
        return "You are not friends with this user"


#@app.route('/users/<string:uid>/friends/')
#def friends_page(uid=None):
#    return render_template('friends-page.html', uid=uid)


#@app.route('/users/<string:uid>/activities/<string:activity_id>/')
#def past_activity(uid=None, activity_id=None):
#    return render_template('past-activity.html', uid=uid, activity_id=activity_id)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=80, debug=True)
