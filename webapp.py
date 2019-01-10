import requests
from flask import Flask, render_template, request, redirect, url_for, abort, Blueprint
from config import ref, storageRef, strava_client, access_token, DEBUG, BASE_ENDPOINT_URL
from helper_functions import get_cookies, get_user_entry, check_user_exists
import datetime
from operator import itemgetter
from stravalib.client import Client as main_strava_client

app = Flask(__name__, static_url_path="/static")

web_app = Blueprint('web_app', __name__)


# Main web app
@web_app.route('/')
def main_page():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    # redirect_link[0] is the actual redirect,
    # redirect_link[1] is the label

    if redirect_link is not None:
        return redirect_link[0]

    my_user_entry = get_user_entry(my_uid)

    lat = request.cookies.get('last_latitude')
    lng = request.cookies.get('last_longitude')

    if my_user_entry is not None:
        has_info = "yes"
        my_email = my_user_entry["email"]

        # Make API call to /api/newsfeed/<uid>/

        url = "https://watshout.run/api/newsfeed/" + my_uid + "/"

        activities = requests.get(url).json()["activities"]

    else:
        has_info = "no"
        my_email = ""
        activities = []

    return render_template('main-app.html', uid=my_uid, my_email=my_email, has_info=has_info,
                           lat=lat, lng=lng, activities=activities)


@web_app.route('/privacy/')
def privacy_policy():
    return "WatShout will not misuse your data"


@web_app.route('/initialize/')
def initialize_account():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    #if redirect_link[0] is not None and redirect_link[1] != "user_entry":
    #    return redirect_link

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

    user_info = {
        "email": email,
        "name": name,
        "profile_pic_url": profile_pic
    }

    # Get friend count
    friends = ref.child("friend_data").child(my_uid).get().val()

    if friends is None:
        user_info["friend_count"] = 0
    else:
        user_info["friend_count"] = len(friends)

    # Get activity count
    activities = ref.child("users").child(my_uid).child("device").child("past").get().val()
    if activities is None:
        user_info["activity_count"] = 0
    else:
        user_info["activity_count"] = len(activities)

    # Get total distance
    distance = 0
    if activities is not None:
        for i in activities:
            distance += float(activities[i]["distance"])

    user_info["total_distance"] = distance

    # Get latest activity image
    latest_activity = ref.child("users").child(my_uid).child("device").child(
        "past").order_by_child("time").limit_to_last(1).get().val()

    if latest_activity is not None:
        for i in latest_activity:
            map_link = latest_activity[i]["map_link"]
            # 47 is the index in which attributes start being defined
            url_front = map_link[:47]
            url_back = map_link[47:]

            new_url = url_front + "&size=2000x300" + url_back
    else:
        new_url = ""

    user_info["latest_activity"] = new_url

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

    return render_template('profile-page.html', uid=my_uid, user_info=user_info,
                           strava_token=strava_token)


# User viewing their own friends list
@web_app.route('/me/friends/')
def my_friends():
    my_uid, verified = get_cookies(request)
    redirect_link = check_user_exists(my_uid, verified)

    if redirect_link is not None:
        return redirect_link

    my_user_entry = get_user_entry(my_uid)

    my_email = my_user_entry['email']

    return render_template('old-friends-page.html', uid=my_uid, my_email=my_email)


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

    send_user_data = {
        'email': my_user_entry['email'],
        'birthday_month': my_user_entry['birthday'][0:2],
        'birthday_day': my_user_entry['birthday'][3:5],
        'birthday_year': my_user_entry['birthday'][6:10]
    }

    try:
        height_feet = my_user_entry['height-feet']
    except KeyError:
        height_feet = None

    try:
        height_inches = my_user_entry['height-inches']
    except KeyError:
        height_inches = None

    try:
        weight = my_user_entry['weight']
    except KeyError:
        weight = None

    try:
        gender = my_user_entry['gender']
        print(gender)
    except KeyError:
        gender = None

    profile_pic_format = my_user_entry['profile_pic_format']
    profile_pic = storageRef.child('users/' + my_uid + '/profile.' + profile_pic_format).get_url(None)

    send_user_data['profile_pic'] = profile_pic

    return render_template('new_settings.html', uid=my_uid, user_data=send_user_data,
                           height_feet=height_feet, height_inches=height_inches,
                           weight=weight, gender=gender)


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
