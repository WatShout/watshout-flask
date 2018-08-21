import requests
from flask import Flask, render_template, request, redirect, url_for, abort, Blueprint
from config import ref, storageRef, strava_client, access_token, DEBUG, BASE_ENDPOINT_URL
from helper_functions import get_cookies, get_user_entry, check_user_exists
import datetime
import time
from operator import itemgetter

app = Flask(__name__, static_url_path="/static")

web_app = Blueprint('web_app', __name__)


# Main web app
@web_app.route('/')
def main_page():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    my_user_entry = get_user_entry(my_uid)

    lat = request.cookies.get('last_latitude')
    lng = request.cookies.get('last_longitude')

    if my_user_entry is not None:
        has_info = "yes"
        my_email = my_user_entry["email"]

        # Make API call to /api/newsfeed/<uid>/

        url = "https://watshout.run/api/newsfeed/" + my_uid + "/"

        activities = requests.get(url).json()["activities"]

        activities = sorted(activities, key=itemgetter('time'))
        activities.reverse()

        for activity in activities:
            activity["formatted_date"] = datetime.datetime.fromtimestamp(
                activity["time"] / 1000
            ).strftime('%Y-%m-%d %H:%M')


    else:
        has_info = "no"
        my_email = ""
        activities = []

    return render_template('main-app.html', uid=my_uid, my_email=my_email, has_info=has_info,
                           lat=lat, lng=lng, activities=activities)


@web_app.route('/privacy/')
def privacy_policy():
    return "WatShout will not misuse your data"


@web_app.route('/new/')
def initialize_account():
    my_uid, verified = get_cookies(request)
    check_user_exists(my_uid, verified)

    return render_template('initialize-account.html', uid=my_uid)


@web_app.route('/whitelist/')
def whitelist():
    my_uid, verified = get_cookies(request)
    check_user_exists(my_uid, verified)

    my_user_entry = get_user_entry(my_uid)

    email = my_user_entry['email']

    domain = email[-12:-4]

    if domain != "watshout":
        return abort(403)
    else:
        return app.send_static_file("whitelist.html")


# Serves simple static login page
@web_app.route('/login/')
def login():
    return app.send_static_file('login.html')


# User viewing their own profile
@web_app.route('/me/')
def my_page():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    if redirect_link is not None:
        return redirect_link

    my_user_entry = get_user_entry(my_uid)

    email = my_user_entry['email']
    name = my_user_entry['name']
    birthday = my_user_entry['birthday']

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
        print("User '" + email + "' has no activities")

    # Get the user's Strava auth token
    try:
        strava_token = ref.child("users").child(my_uid).get().val()['strava_token']

    # User hasn't authenticated with Strava, throw an error
    except KeyError:
        strava_token = "no"
        print("User '" + email + "' is not connected with Strava")

    return render_template('profile-page.html', email=email, my_email=email, name=name, birthday=birthday, uid=my_uid,
                           activity_ids=activity_ids, strava_token=strava_token,
                           profile_pic=profile_pic)


# User viewing their own friends list
@web_app.route('/me/friends/')
def my_friends():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    if redirect_link is not None:
        return redirect_link

    my_user_entry = get_user_entry(my_uid)

    my_email = my_user_entry['email']

    return render_template('friends-page.html', uid=my_uid, my_email=my_email)


# News feed
@web_app.route('/feed/')
def news_feed():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    if redirect_link is not None:
        return redirect_link

    my_user_entry = get_user_entry(my_uid)

    json_data = requests.get(BASE_ENDPOINT_URL + '/api/newsfeed/' + my_uid + '/').json()["activities"]

    return render_template('news-feed.html', uid=my_uid, activities=json_data, email=my_user_entry["email"])


# User changing their own settings
@web_app.route('/me/settings/')
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
@web_app.route('/me/strava/login/')
def strava_login():

    my_uid = request.cookies.get('uid')
    if my_uid is None:
        return redirect(url_for('web_app.login'))

    verified = request.cookies.get('verified')
    if verified is None:
        return render_template('email-verify.html', uid=my_uid)

    if not DEBUG:
        uri = BASE_ENDPOINT_URL + '/me/strava/authorized/'
    else:
        uri = 'http://127.0.0.1:5000/me/strava/authorized/'

    authorize_url = None

    if not access_token:
        authorize_url = strava_client.authorization_url(
            client_id=26116,
            redirect_uri=uri,
            approval_prompt='auto',
            scope='view_private,write'
        )
        return redirect(authorize_url, code=302)


# Loads a page that makes Firebase updates and then redirects to user page
@web_app.route('/me/strava/authorized/')
def strava_authorized():
    code = request.args.get('code')

    my_uid = request.cookies.get('uid')
    if my_uid is None:
        return redirect(url_for('web_app.login'))

    verified = request.cookies.get('verified')
    if verified is None:
        return render_template('email-verify.html', uid=my_uid)

    access_token = strava_client.exchange_code_for_token(
        client_id=26116,
        client_secret='04ba9a4ac548cdc94c375baf65ceb95eca3af533',
        code=code)

    strava_client.access_token = access_token

    # client.upload_activity(test_run, 'gpx')

    return render_template('strava-authorized.html',
                           token=access_token,
                           uid=my_uid)


# Viewing another user's profile page
@web_app.route('/users/<string:their_uid>/')
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
        birthday = ref.child("users").child(their_uid).get().val()['birthday']

        profile_pic_format = ref.child("users").child(their_uid).get().val()['profile_pic_format']
        profile_pic = storageRef.child('users/' + their_uid + '/profile.' + profile_pic_format).get_url(None)

        # TODO: Use api endpoint to get list of user's activities

    return "Work in progress"
