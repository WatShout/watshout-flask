import json
import urllib.request
import polyline
import pyrebase
from urllib.request import urlopen
from PIL import Image
from flask import Flask, render_template, request, redirect, url_for, make_response
from stravalib.client import Client

from pyfcm import FCMNotification

push_service = FCMNotification(api_key="AAAAhTZslrE:APA91bGk1e8XXWROc6sCBZtNX2RAXpXd1BQauM4d2h3ACHf33ypAYBf70oODEwqOwnhPVNvgXRPGqZ0TEMQk7RiJiACZXSdr0Cp5SPwpeEmk2FJVrvDVqxTck5svaw27Sft4y1cSmUs5")

client = Client()
access_token = None

from twilio.rest import Client
twilio_client = Client('AC78e6f5f0eee70cd307d2c801965890f8', '29be32eb089f379f6622e7365b280727')

app = Flask(__name__, static_url_path="/static")

# Note: Everything is authenticated because of the service account
config = {
    "apiKey": "AIzaSyCEFFfLVU_lFaUt8bYL0E0zYtkeYsepU4A",
    "authDomain": "watshout-app.firebaseapp.com",
    "databaseURL": "https://watshout-app.firebaseio.com",
    "projectID": "watshout-app",
    "storageBucket": "watshout-app.appspot.com",
    "serviceAccount": "serviceAccountCredentials.json"
}

firebase = pyrebase.initialize_app(config)

# Get a reference to the database service
ref = firebase.database()
storageRef = firebase.storage()

DEBUG = False


# Gets UID and verified cookies from HTTP request
def get_cookies(this_request):
    uid = this_request.cookies.get('uid')
    verified = this_request.cookies.get('verified')
    return uid, verified


# Gets all of a user's information
def get_user_entry(uid):
    return ref.child("users").child(uid).get().val()


# Performs redirects based on user authentication, email verification, etc.
def check_user_exists(uid, verified):

    user_entry = ref.child("users").child(uid).get().val()

    if uid is None:
        return redirect(url_for('login'))

    elif user_entry is None:
        return redirect(url_for('main_page'))

    elif verified is None:
        return render_template('email-verify.html', uid=uid)

    else:
        return None


# Main web app
@app.route('/')
def main_page():
    my_uid, verified = get_cookies(request)
    check_user_exists(my_uid, verified)

    my_user_entry = get_user_entry(my_uid)

    if my_user_entry is not None:
        has_info = "yes"
        my_email = my_user_entry["email"]

    else:
        has_info = "no"
        my_email = ""

    return render_template('main-app.html', uid=my_uid, my_email=my_email, has_info=has_info)


# Creates a verified cookie for user
@app.route('/cookies/verified/create/')
def create_verification_cookie():
    res = make_response()
    res.set_cookie('verified', 'true', max_age=60 * 60 * 24 * 7 * 365)
    return res


# Creates UID cookie for user
@app.route('/cookies/uid/create/<string:uid>')
def create_uid_cookie(uid=None):
    res = make_response()
    res.set_cookie('uid', uid, max_age=60 * 60 * 24 * 7 * 365)
    return res


# Deletes cookie upon logout
@app.route('/cookies/delete/<string:uid>')
def delete_uid_cookie(uid=None):
    res = make_response()
    res.set_cookie('uid', uid, max_age=0)
    res.set_cookie('verified', 'true', max_age=0)
    return res


# Serves simple static login page
@app.route('/login/')
def login():
    return app.send_static_file('login.html')


# User viewing their own profile
@app.route('/me/')
def my_page():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    if redirect_link is not None:
        return redirect_link

    my_user_entry = get_user_entry(my_uid)

    email = my_user_entry['email']
    name = my_user_entry['name']
    age = my_user_entry['age']

    profile_pic_format = my_user_entry['profile_pic_format']
    profile_pic = storageRef.child('users/' + my_uid + '/profile.' + profile_pic_format).get_url(None)

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

    # User hasn't authenticated with Strava, throw an error
    except KeyError:
        strava_token = "no"
        print("KeyError: No Strava connection")

    return render_template('profile-page.html', email=email, my_email=email, name=name, age=age, uid=my_uid,
                           activity_ids=activity_ids, strava_token=strava_token,
                           profile_pic=profile_pic)


# User viewing their own friends list
@app.route('/me/friends/')
def my_friends():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    if redirect_link is not None:
        return redirect_link

    my_user_entry = get_user_entry(my_uid)

    my_email = my_user_entry['email']

    try:
        my_friends = ref.child("friend_data").child(my_uid).get().val()

        friend_links = []

        for their_uid in my_friends:
            their_email = ref.child("users").child(their_uid).child("email").get().val()
            link = '<a id="' + their_uid + '" href="/users/' + their_uid + '">' + their_email + '</a>'
            friend_links.append(link)

    except TypeError:
        friend_links = []

    return render_template('friends-page.html', uid=my_uid, my_email=my_email)


# User changing their own settings
@app.route('/me/settings/')
def my_settings():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    if redirect_link is not None:
        return redirect_link

    my_user_entry = get_user_entry(my_uid)

    email = my_user_entry['email']

    profile_pic_format = my_user_entry['profile_pic_format']
    profile_pic = storageRef.child('users/' + my_uid + '/profile.' + profile_pic_format).get_url(None)

    return render_template('settings.html', uid=my_uid,
                           email=email, profile_pic=profile_pic)


# Redirects to Strava callback URL
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


# Loads a page that makes Firebase updates and then redirects to user page
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


# Viewing another user's profile page
@app.route('/users/<string:their_uid>/')
def user_page(their_uid=None):

    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    if redirect_link is not None:
        return redirect_link

    my_user_entry = get_user_entry(my_uid)

    my_email = my_user_entry["email"]
    my_friends = ref.child("friend_data").child(my_uid).get().val()

    if their_uid in my_friends:

        email = ref.child("users").child(their_uid).get().val()['email']
        name = ref.child("users").child(their_uid).get().val()['name']
        age = ref.child("users").child(their_uid).get().val()['age']

        profile_pic_format = ref.child("users").child(their_uid).get().val()['profile_pic_format']
        profile_pic = storageRef.child('users/' + their_uid + '/profile.' + profile_pic_format).get_url(None)

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
                               activity_ids=activity_ids, profile_pic=profile_pic)
    else:
        return "You are not friends with this user"


# Sending FCM data payloads
@app.route('/notifications/data/', methods=['POST'])
def send_data_notification():

    try:
        uid = request.form["uid"]

        token = ref.child("users").child(uid).child("firebase_messaging_token").get().val()

        registration_id = token

        message = request.form["message"]

        # Sending a notification with data message payload
        data_message = {
            "message": message
        }

        result = push_service.single_device_data_message(registration_id=registration_id, data_message=data_message)

        return json.dumps({'locationSuccess': True}), 200, {'ContentType': 'application/json'}

    except Exception:
        return json.dumps({'locationSuccess': False}), 500, {'ContentType': 'application/json'}


# URL for uploading a Strava activity
@app.route('/mobile/strava/<string:uid>/<string:file_name>/')
def upload_activity(uid=None, file_name=None):
    try:

        id = file_name

        strava_token = ref.child("users").child(uid).child("strava_token").get().val()
        client.access_token = strava_token

        file_name = file_name + ".gpx"

        url = storageRef.child("users").child(uid).child("gpx").child(file_name).get_url(None)

        url_response = urllib.request.urlopen(url)
        data = url_response.read()
        parsed_data = data.decode('utf-8')

        client.upload_activity(parsed_data, 'gpx')

        return json.dumps({'locationSuccess': True}), 200, {'ContentType': 'application/json'}
    except Exception as e:
        print(e)
        return json.dumps({'locationSuccess': False}), 69, {'ContentType': 'application/json'}


# URL for sending a SMS message
@app.route('/twilio/send/', methods=['POST'])
def send_message():

    if request.method == 'GET':
        return json.dumps({'locationSuccess': False}), 405, {'ContentType': 'application/json'}

    try:
        message = request.headers.get('message')
        to_number = request.headers.get('to_number')
        twilio_number = '+18312788199'

        twilio_message = twilio_client.messages.create(
            body=message,
            from_=twilio_number,
            to=to_number
        )

        return json.dumps({'locationSuccess': True}), 200, {'ContentType': 'application/json'}

    except Exception:
        return json.dumps({'locationSuccess': False}), 500, {'ContentType': 'application/json'}


@app.route('/json/', methods=['GET'])
def send_json():

    data = {

        "strings": [

            {"title": "richard",
             "image": "https://maps.googleapis.com/maps/api/staticmap?center=_flwF~g|`Vzoom=13&size=600x300&maptype=roadmap&key=AIzaSyCWobaV5cYUhGJChYDEVro7JVF5299dzz0&path=enc:_p~iF~ps|U_ulL~ugC_hgN~eq`@&sensor=true"},

            {"title": "erlich",
             "image": "https://maps.googleapis.com/maps/api/staticmap?center=_flwF~g|`Vzoom=13&size=600x300&maptype=roadmap&key=AIzaSyCWobaV5cYUhGJChYDEVro7JVF5299dzz0&path=enc:_p~iF~ps|U_ulL~ugC_hgN~eq`@&sensor=true"},

            {"title": "dinesh",
             "image": "https://maps.googleapis.com/maps/api/staticmap?center=_flwF~g|`Vzoom=13&size=600x300&maptype=roadmap&key=AIzaSyCWobaV5cYUhGJChYDEVro7JVF5299dzz0&path=enc:_p~iF~ps|U_ulL~ugC_hgN~eq`@&sensor=true"},

            {"title": "gilfoyle",
             "image": "https://maps.googleapis.com/maps/api/staticmap?center=_flwF~g|`Vzoom=13&size=600x300&maptype=roadmap&key=AIzaSyCWobaV5cYUhGJChYDEVro7JVF5299dzz0&path=enc:_p~iF~ps|U_ulL~ugC_hgN~eq`@&sensor=true"},

            {"title": "jared",
             "image": "https://maps.googleapis.com/maps/api/staticmap?center=_flwF~g|`Vzoom=13&size=600x300&maptype=roadmap&key=AIzaSyCWobaV5cYUhGJChYDEVro7JVF5299dzz0&path=enc:_p~iF~ps|U_ulL~ugC_hgN~eq`@&sensor=true"}

        ]
    }

    json_data = json.dumps(data)

    return json_data


@app.route('/polyline/')
def return_polyline():
    #return polyline.encode([(38.5, -120.2), (40.7, -120.9), (43.2, -126.4)], 5)

    file = urlopen("https://maps.googleapis.com/maps/api/staticmap?center=_flwF~g|`Vzoom=13&size=600x300&maptype=roadmap&key=AIzaSyCWobaV5cYUhGJChYDEVro7JVF5299dzz0&path=enc:_p~iF~ps|U_ulL~ugC_hgN~eq`@&sensor=true")
    img = Image.open(file)
    img.show()
    return img


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=80, debug=True)
