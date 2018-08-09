import json
import urllib.request

import polyline
import xmltodict
from flask import request, Blueprint

from config import ref, storageRef, BASE_CREATE_MAP_URL, strava_client
from helper_functions import create_json_activities_list, parse_activity_snapshot

api = Blueprint('api', __name__)


# Creates a static Google Maps image with running path plotted
@api.route('/api/createmap/', methods=['POST'])
def get_map_url():

    uid = request.form['uid']
    time_stamp = request.form['time_stamp']
    file_name = time_stamp + ".gpx"

    url = storageRef.child("users").child(uid).child("gpx").child(file_name).get_url(None)

    # TODO: Change this
    ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("event_name").set("Test Location run")

    url_response = urllib.request.urlopen(url)
    data = url_response.read()
    parsed_data = data.decode('utf-8')

    gpx_dict = xmltodict.parse(parsed_data)

    lats = []
    lons = []

    try:
        for each in gpx_dict['gpx']['trk']['trkseg']['trkpt']:
            lats.append(float(each['@lat']))
            lons.append(float(each['@lon']))

            coords = [[lat, lon] for lat, lon in zip(lats, lons)]

            poly_path = "&path=enc:" + polyline.encode(coords, 5)

            final_url = BASE_CREATE_MAP_URL + poly_path

    except Exception as e:
        final_url = "https://dubsism.files.wordpress.com/2017/12/image-not-found.png?w=1094"
        print(e)

    finally:
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("map_link").set(final_url)
        return final_url


# URL for uploading a Strava activity
@api.route('/api/strava/upload/<string:uid>/<string:file_name>/', methods=['GET'])
def upload_activity(uid=None, file_name=None):
    try:

        id = file_name

        strava_token = ref.child("users").child(uid).child("strava_token").get().val()
        strava_client.access_token = strava_token

        file_name = file_name + ".gpx"

        url = storageRef.child("users").child(uid).child("gpx").child(file_name).get_url(None)

        url_response = urllib.request.urlopen(url)
        data = url_response.read()
        parsed_data = data.decode('utf-8')

        strava_client.upload_activity(parsed_data, 'gpx')

        return json.dumps({'locationSuccess': True}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

    except KeyError:
        return json.dumps({'locationSuccess': False}), 403, {'Content-Type': 'text/javascript; charset=utf-8'}


# Retrieves a friends list as JSON
@api.route('/api/friendrequests/<string:uid>/', methods=['GET'])
def get_friend_requests_list(uid=None):

    try:
        friend_request_uid_list = list(ref.child("friend_requests").child(uid).order_by_child("request_type").equal_to("received").get().val())

    except IndexError:
        friend_request_uid_list = []

    data = {"friend_requests": []}

    for uid in friend_request_uid_list:
        name = ref.child("users").child(uid).child("name").get().val()
        profile_pic_format = ref.child("users").child(uid).child("profile_pic_format").get().val()
        profile_pic = storageRef.child("users").child(uid).child("profile." + profile_pic_format).get_url(None)
        uid = uid

        data["friend_requests"].append({
            "name": name,
            "profile_pic": profile_pic,
            "uid": uid
        })

    return json.dumps(data), 200, {'Content-Type': 'text/javascript; charset=utf-8'}


# Gets list of current friends as JSON
@api.route('/api/friends/<string:uid>/', methods=['GET'])
def get_friends_list(uid=None):

    try:
        friend_uid_list = list(ref.child("friend_data").child(uid).get().val().keys())
    except AttributeError:
        friend_uid_list = []

    data = {"friends": []}

    for uid in friend_uid_list:
        name = ref.child("users").child(uid).child("name").get().val()
        profile_pic_format = ref.child("users").child(uid).child("profile_pic_format").get().val()
        profile_pic = storageRef.child("users").child(uid).child("profile." + profile_pic_format).get_url(None)
        uid = uid

        data["friends"].append({
            "name": name,
            "profile_pic": profile_pic,
            "uid": uid
        })

    return json.dumps(data), 200, {'Content-Type': 'text/javascript; charset=utf-8'}


# Retrieves some number (TBD) of recent activities completed by friends
@api.route('/api/newsfeed/<string:uid>/', methods=['GET'])
def send_json(uid=None):

    try:
        friends = list(ref.child("friend_data").child(uid).get().val().keys())
    except AttributeError:
        friends = []

    activities_dict = {}

    for their_uid in friends:
        snapshot = ref.child("users").child(their_uid)\
            .child("device").child("past")\
            .order_by_child("time").limit_to_last(5).get().val()

        their_name = ref.child("users").child(their_uid).child("name").get().val()

        if snapshot is not None:
            activities_dict.update(parse_activity_snapshot(snapshot, their_uid, their_name))

    # TODO: Sort activities_dict

    json_data = create_json_activities_list(activities_dict)

    return json_data, 200, {'Content-Type': 'text/javascript; charset=utf-8'}


# Gets every activity completed by the user as JSON
@api.route('/api/history/<string:uid>/', methods=['GET'])
def get_calendar_json(uid=None):

    activities_dict = ref.child("users").child(uid).child("device").child("past").get().val()

    data = {"activities": []}

    if activities_dict is not None:
        for key, value in activities_dict.items():

            current_data = {"time": value['time']}

            try:
                current_data["image"] = value['map_link']
            except KeyError:
                current_data["image"] = None

            try:
                current_data["event_name"] = value['event_name']
            except KeyError:
                current_data["event_name"] = None

            data["activities"].append(current_data)

    return json.dumps(data), 200, {'Content-Type': 'text/javascript; charset=utf-8'}
