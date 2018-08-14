from config import ref
from flask import redirect, url_for, render_template
import collections
import json
import requests
import urllib.request
import xmltodict
import polyline
from config import BASE_CREATE_MAP_URL


def get_friend_uid_list(my_uid):
    return list(ref.child("friend_data").child(my_uid).get().val().items())


def create_map_url(gpx_url):
    url_response = urllib.request.urlopen(gpx_url)
    data = url_response.read()
    parsed_data = data.decode('utf-8')

    gpx_dict = xmltodict.parse(parsed_data)

    lats = []
    lons = []

    return_data = {}

    try:
        for each in gpx_dict['gpx']['trk']['trkseg']['trkpt']:
            lats.append(float(each['@lat']))
            lons.append(float(each['@lon']))

        coords = [[lat, lon] for lat, lon in zip(lats, lons)]

        poly_path = polyline.encode(coords, 5)

        return_data["url"] = BASE_CREATE_MAP_URL + poly_path
        return_data["first_lat"] = lats[0]
        return_data["first_lon"] = lons[0]

        return return_data

    except Exception as e:
        print(e)
        return "https://dubsism.files.wordpress.com/2017/12/image-not-found.png?w=1094"


def get_location_from_latlng(lat, lng):

    latlng = str(lat) + "," + str(lng)

    url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latlng + "&key=AIzaSyAxkvxOLITaJbTjnNXxDzDAwRyZaWD0D4s"
    request = requests.get(url)

    try:
        city_name = request.json()["results"][1]["address_components"][2]["long_name"]

        # Strip formatting
        city_name.replace('"', '')
        city_name.replace("'", "")

        return city_name
    except IndexError:
        return ""


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

        try:
            pace = value['pace']
        except KeyError:
            pace = None

        activities_dict[activity_id] = [their_uid, time, map_link, their_name, event_name, distance, time_elapsed, pace,
                                        activity_id]

    return activities_dict


def create_json_activities_list(activities_dict):

    their_uid = 0
    time = 1
    map_link = 2
    their_name = 3
    event_name = 4
    distance = 5
    time_elapsed = 6
    pace = 7
    activity_id = 8

    data = {"activities": []}

    if activities_dict is not None:
        for key, value in activities_dict.items():
            data["activities"].append(
                {
                    "uid": value[their_uid],
                    "name": value[their_name],
                    "map_link": value[map_link],
                    "time": value[time],
                    "event_name": value[event_name],
                    "distance": value[distance],
                    "time_elapsed": value[time_elapsed],
                    "pace": value[pace],
                    "activity_id": key
                }
            )

    return json.dumps(data)

