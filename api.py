import json
import ssl
import time
import urllib.request
from datetime import datetime
from tempfile import NamedTemporaryFile
import requests

import gpxpy
import gpxpy.gpx
from flask import request, Blueprint
from stravalib.client import Client as StravaClient

from config import ref, storageRef, push_service
from helper_functions import create_json_activities_list, parse_activity_snapshot, get_location_from_latlng, \
    create_map_url, get_friend_uid_list, JSON_SUCCESS, get_weather

api = Blueprint('api', __name__)

@api.route('/api/testme/', methods=['GET', 'POST'])
def testme():
    data = ref.child("users").get().val()
    return str(data)


# Performs the three email checks
# 1) .edu
# 2) watshout.com
# 3) whitelist
@api.route('/api/authorized/', methods=['GET', 'POST'])
def check_user():
    email = request.form['email']
    email = email.lower()

    return JSON_SUCCESS

    """
    For now this always returns true (for testing)
    if email[-4:] == ".edu" or email[-12:] == "watshout.com":
        return JSON_SUCCESS
    else:
        try:
            result = ref.child("whitelisted_emails").order_by_child("email").equal_to(email).get().val()

            if len(result) > 0:
                return JSON_SUCCESS
            else:
                return JSON_FAIL

        except IndexError:
            return JSON_FAIL
    """


# TODO: Implement this
# Iterate through all current runs and delete those who haven't moved in the past 30 minutes
@api.route('/api/deleteidleruns/', methods=['GET', 'POST'])
def delete_idle_runs():
    return json.dumps({'result': 'success'}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}


# Run this to send a FCM to every device currently in an activity
@api.route('/api/wakedevices/', methods=['GET'])
def wake_devices():
    data = ref.child("users").get().val()

    reg_ids = []

    for key, value in data.items():
        try:
            current = value['device']['current']
            reg_ids.append(value['fcm_token'])

        except KeyError:
            pass

    data_message = {
        "wake": True
    }
    try:
        result = push_service.multiple_devices_data_message(registration_ids=reg_ids, data_message=data_message,
                                                            collapse_key="wake")
        return json.dumps({'result': result}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}
    except Exception:
        return json.dumps({'success': False}), 500, {'Content-Type': 'text/javascript; charset=utf-8'}


# Send notification to friends when user starts running
@api.route('/api/activitystartnotification/', methods=['GET', 'POST'])
def send_activity_start_notification():
    my_uid = request.form['my_uid']
    my_name = ref.child("users").child(my_uid).child("name").get().val()

    friends = get_friend_uid_list(my_uid)

    friend_fcm_tokens = []

    for friend in friends:
        uid = friend[0]
        their_token = ref.child("users").child(uid).child("fcm_token").get().val()

        if their_token is not None:
            friend_fcm_tokens.append(their_token)

    message_title = my_name + " started a run!"
    message_body = "Open watshout to track your friend"

    try:
        result = push_service.notify_multiple_devices(registration_ids=friend_fcm_tokens, message_title=message_title,
                                                      message_body=message_body)
        return json.dumps({'result': result}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}
    except Exception:
        return json.dumps({'success': False}), 500, {'Content-Type': 'text/javascript; charset=utf-8'}


# Send notification when adding a new friend
@api.route('/api/sendfriendnotification/', methods=['GET', 'POST'])
def send_friend_request():
    my_uid = request.form['my_uid']
    their_uid = request.form['their_uid']

    my_name = ref.child("users").child(my_uid).child("name").get().val()

    message_title = "Friend Request"
    message_body = my_name + " wants to be your friend!"

    registration_id = ref.child("users").child(their_uid).child("fcm_token").get().val()

    try:
        result = push_service.notify_single_device(registration_id=registration_id, message_title=message_title,
                                                   message_body=message_body)

        return json.dumps({'result': result}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}
    except Exception as e:
        return json.dumps({'success': False, 'error': e}), 500, {'Content-Type': 'text/javascript; charset=utf-8'}


# Creates a static Google Maps image with running path plotted
@api.route('/api/addactivity/', methods=['GET', 'POST'])
def add_activity():
    uid = request.form['uid']
    upload_time = float(request.form['time'])
    time_stamp = request.form['time_stamp']
    time_elapsed = float(request.form['time_elapsed'])
    pace = request.form['pace']
    map_url = request.form['map_url']
    distance = float(request.form['distance'])

    gpx = gpxpy.gpx.GPX()

    # Create first track in our GPX:
    gpx_track = gpxpy.gpx.GPXTrack()
    gpx.tracks.append(gpx_track)

    # Create first segment in our GPX track:
    gpx_segment = gpxpy.gpx.GPXTrackSegment()
    gpx_track.segments.append(gpx_segment)

    data = ref.child("users").child(uid).child("device").child("current").get().val()

    # Build GPX
    for key, value in data.items():
        formatted_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(value["time"] / 1000))
        datetime_object = datetime.strptime(formatted_time, '%Y-%m-%d %H:%M:%S')
        gpx_segment.points.append(gpxpy.gpx.GPXTrackPoint(latitude=value["lat"], longitude=value["lon"],
                                                          elevation=value["altitude"], time=datetime_object))

    # Move database entry to 'past'
    ref.child("users").child(uid).child("device").child("past").child(time_stamp).set({
        "distance": distance,
        "map_link": map_url,
        "time": upload_time,
        "time_elapsed": time_elapsed,
        "type": "run",
        "pace": pace
    })

    ref.child("users").child(uid).child("device").child("current").remove()

    with NamedTemporaryFile() as temp:
        temp.write(gpx.to_xml().encode())
        temp.fileinfo = {'type': 'text/xml',
                         'Content-Type': 'text/xml'}
        temp.seek(0)

        storageRef.child("users").child(uid).child("gpx").child(time_stamp + ".gpx").put(temp)
        gpx_url = storageRef.child("users").child(uid).child("gpx").child(time_stamp + ".gpx").get_url(None)

    # Note: Map URL creation has been offloaded to the Android app
    try:
        map_data = create_map_url(gpx_url)
        first_lat = map_data["first_lat"]
        first_lon = map_data["first_lon"]

        city_name = get_location_from_latlng(first_lat, first_lon)
        event_name = city_name + " run"

        weather_id, weather_type, temp_celsius = get_weather(first_lat, first_lon)

        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("weather_type").set(
            weather_type)
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("weather_id").set(
            weather_id)
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("temp_celsius").set(
            temp_celsius)
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("event_name").set(
            event_name)

        return json.dumps({'success': True}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

    except Exception as e:
        print(e)
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("weather_type").set(
            None)
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("weather_id").set(
            None)
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("temp_celsius").set(
            None)
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("event_name").set(
            "Run")
        return json.dumps({'success': True}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}


# URL for uploading a Strava activity
@api.route('/api/strava/upload/<string:uid>/<string:file_name>/', methods=['GET'])
def upload_activity(uid=None, file_name=None):
    try:
        strava_token = ref.child("users").child(uid).child("strava_token").get().val()
        print(strava_token)

        c = StravaClient(access_token=strava_token)

        file_name += ".gpx"

        url = storageRef.child("users").child(uid).child("gpx").child(file_name).get_url(None)
        gcontext = ssl.SSLContext(ssl.PROTOCOL_TLSv1)  # Only for gangstars
        url_response = urllib.request.urlopen(url, context=gcontext)
        data = url_response.read()
        parsed_data = data.decode('utf-8')

        c.upload_activity(parsed_data, 'gpx')

        return json.dumps({'locationSuccess': True}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

    except KeyError:
        return json.dumps({'locationSuccess': False}), 403, {'Content-Type': 'text/javascript; charset=utf-8'}


# Retrieves a friends list as JSON
@api.route('/api/friendrequests/<string:uid>/', methods=['GET'])
def get_friend_requests_list(uid=None):
    try:
        # exists = ref.child("friend_requests").child(uid).get().val()
        # if exists is not None:
        test = "https://watshout-cloud.firebaseio.com/friend_requests/{0}.json?orderBy=%22request_type%22&equalTo=%22received%22".format(uid)
        friend_request_uid_list = list(requests.get(test).json())
        print(friend_request_uid_list)
        #friend_request_uid_list = list(
            #ref.child("friend_requests").child(uid).order_by_child("request_type").equal_to("received").get().val())

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
        friend_uid_list = get_friend_uid_list(uid)
    except AttributeError:
        friend_uid_list = []

    data = {"friends": []}

    for uid, since in friend_uid_list:
        name = ref.child("users").child(uid).child("name").get().val()
        profile_pic_format = ref.child("users").child(uid).child("profile_pic_format").get().val()
        profile_pic = storageRef.child("users").child(uid).child("profile." + profile_pic_format).get_url(None)
        uid = uid

        data["friends"].append({
            "name": name,
            "profile_pic": profile_pic,
            "uid": uid,
            "since": since
        })

    return json.dumps(data), 200, {'Content-Type': 'text/javascript; charset=utf-8'}


# Retrieves some number (TBD) of recent activities completed by friends
@api.route('/api/newsfeed/<string:uid>/', methods=['GET'])
def get_news_feed(uid=None):

    try:
        friends = get_friend_uid_list(uid)
    except AttributeError:
        friends = []

    activities_dict = {}

    for friend in friends:

        their_uid = friend[0]
        snapshot = ref.child("users").child(their_uid) \
            .child("device").child("past") \
            .order_by_child("time").limit_to_last(5).get().val()

        their_name = ref.child("users").child(their_uid).child("name").get().val()
        extension = ref.child("users").child(their_uid).child("profile_pic_format").get().val()
        profile_pic_url = storageRef.child("users").child(their_uid).child("profile." + extension).get_url(None)

        if snapshot is not None:
            activities_dict.update(parse_activity_snapshot(snapshot, their_uid, their_name, profile_pic_url))

    json_data = create_json_activities_list(activities_dict)

    return json_data, 200, {'Content-Type': 'text/javascript; charset=utf-8'}


# Gets every activity completed by the user as JSON
@api.route('/api/history/<string:uid>/', methods=['GET'])
def get_calendar_json(uid=None):
    activities_dict = ref.child("users").child(uid).child("device").child("past").get().val()

    extension = ref.child("users").child(uid).child("profile_pic_format").get().val()
    profile_pic_url = storageRef.child("users").child(uid).child("profile." + extension).get_url(None)

    data = {"activities": []}

    if activities_dict is not None:
        for key, value in activities_dict.items():

            current_data = {"time": value['time']}

            attributes_list = ["map_link", "event_name", "distance", "time_elapsed", "pace",
                               "temp_celsius", "weather_type", "weather_id"]

            for attrib in attributes_list:
                try:
                    current_data[attrib] = value[attrib]
                except KeyError:
                    current_data[attrib] = None

            try:
                current_data["activity_id"] = key
            except KeyError:
                current_data["activity_id"] = None

            try:
                current_data["profile_pic_url"] = profile_pic_url
            except KeyError:
                current_data["profile_pic_url"] = None

            data["activities"].append(current_data)

    return json.dumps(data), 200, {'Content-Type': 'text/javascript; charset=utf-8'}
