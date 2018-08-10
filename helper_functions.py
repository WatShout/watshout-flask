from config import ref
from flask import redirect, url_for, render_template
import collections
import json


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
        return redirect(url_for('web_app.login'))

    elif user_entry is None:
        return redirect(url_for('web_app.main_page'))

    elif verified is None:
        return render_template('email-verify.html', uid=uid)

    else:
        return None


def parse_activity_snapshot(snapshot, their_uid, their_name):

    activities_dict = {}

    snapshot = collections.OrderedDict(reversed(list(snapshot.items())))

    for key, value in snapshot.items():

        activity_id = key
        time = value['time']

        try:
            map_link = value['map_link']
        except KeyError:
            map_link = None

        try:
            event_name = value['event_name']
        except KeyError:
            event_name = None

        try:
            distance = value['distance']
        except KeyError:
            distance = None

        try:
            time_elapsed = value['time_elapsed']
        except KeyError:
            time_elapsed = None

        activities_dict[activity_id] = [their_uid, time, map_link, their_name, event_name, distance, time_elapsed]

    return activities_dict


def create_json_activities_list(activities_dict):

    their_uid = 0
    time = 1
    map_link = 2
    their_name = 3
    event_name = 4
    distance = 5
    time_elapsed = 6

    data = {"activities": []}

    if activities_dict is not None:
        for key, value in activities_dict.items():
            data["activities"].append(
                {
                    "uid": value[their_uid],
                    "name": value[their_name],
                    "image": value[map_link],
                    "time": value[time],
                    "event_name": value[event_name],
                    "distance": value[distance],
                    "time_elapsed": value[time_elapsed]
                }
            )

    return json.dumps(data)

