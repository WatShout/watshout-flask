from flask import Flask, render_template, Markup, request, redirect
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


# Note: this will eventually redirect to the 'main' page
@app.route('/')
def redirect_to_app():
    return "This will eventually be the home of the main web page"


@app.route('/app/')
def main_map():
    return app.send_static_file('main_app.html')


@app.route('/login/')
def log_in():
    return app.send_static_file('login.html')


@app.route('/users/<uid>/strava/login/')
def strava_login(uid=None):

    if not DEBUG:
        uri = 'https://watshout.herokuapp.com/users/' + uid + '/strava/authorized/'
    else:
        uri = 'http://127.0.0.1:5000/users/' + uid + '/strava/authorized/'


    authorize_url = None
    if not access_token:
        authorize_url = client.authorization_url(
            client_id=26116,
            redirect_uri=uri,
            approval_prompt='auto',
            scope='view_private,write'
        )
        return redirect(authorize_url, code=302)


@app.route('/users/<uid>/strava/authorized/')
def strava_authorized(uid=None):

    code = request.args.get('code')
    access_token = client.exchange_code_for_token(
        client_id=26116,
        client_secret='04ba9a4ac548cdc94c375baf65ceb95eca3af533',
        code=code)

    client.access_token = access_token

    #client.upload_activity(test_run, 'gpx')

    return render_template('strava-authorized.html',
                           token=access_token,
                           uid=uid)


@app.route('/users/<uid>/')
def user_page(uid=None):

    # Try to display a simple page with user info
    try:
        email = ref.child("users").child(uid).get().val()['email']
        name = ref.child("users").child(uid).get().val()['name']
        age = ref.child("users").child(uid).get().val()['age']

    # If user isn't found in the database we assume they don't exist
    except TypeError:
        print("TypeError: User doesn't exist")
        return render_template('user_doesnt_exist.html', uid=uid)

    # Try to build a list of user's activities
    try:
        device = ref.child("users").child(uid).get().val()['device']['past']

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
        strava_token = ref.child("users").child(uid).get().val()['strava_token']

    # User hasn't authenticated with Strava
    except KeyError:
        strava_token = ""
        print("KeyError: No Strava connection")

    return render_template('user-page.html', email=email, name=name, age=age, uid=uid,
                           activity_ids=activity_ids, strava_token=strava_token)


@app.route('/users/<string:uid>/activities/<string:activity_id>/')
def past_activity(uid=None, activity_id=None):
    return render_template('activity.html', uid=uid, activity_id=activity_id)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=80, debug=True)
