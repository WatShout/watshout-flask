import json
import urllib.request

from flask import request, Blueprint
import polyline
from operator import itemgetter
import datetime

from config import ref, storageRef, strava_client, push_service, gmaps, BASE_CREATE_MAP_URL
from helper_functions import create_json_activities_list, parse_activity_snapshot, get_location_from_latlng, \
     create_map_url, get_friend_uid_list, get_km_from_coord_string, JSON_SUCCESS, JSON_FAIL, get_weather

api = Blueprint('api', __name__)


# Performs the three email checks
# 1) .edu
# 2) watshout.com
# 3) whitelist
@api.route('/api/authorized/', methods=['GET', 'POST'])
def check_user():
    email = request.form['email']
    email = email.lower()

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


# Not in use right now
@api.route('/api/createroadsnap/', methods=['GET', 'POST'])
def create_road_snap():
    coordinate_string = request.form['coordinates']
    coordinate_list = coordinate_string.split("|")

    distance = get_km_from_coord_string(coordinate_string)

    result = gmaps.snap_to_roads(path=coordinate_list, interpolate=True)

    lats = []
    lons = []

    if len(result) > 0:

        try:

            for location in result:
                lats.append(float(location['location']['latitude']))
                lons.append(float(location['location']['longitude']))

            # Figure out how this works
            coords = [[lat, lon] for lat, lon in zip(lats, lons)]

            return_data = {
                "map_url": BASE_CREATE_MAP_URL + polyline.encode(coords, 5),
                "distance_km": distance
            }

            return return_data

        except Exception as e:
            return json.dumps({"error": str(e)}), 500, {'Content-Type': 'text/javascript; charset=utf-8'}

    else:
        return json.dumps({"success": False}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}


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
    time_stamp = request.form['time_stamp']
    file_name = time_stamp + ".gpx"

    gpx_url = storageRef.child("users").child(uid).child("gpx").child(file_name).get_url(None)

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
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("event_name").set(
            event_name)
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("temp_celsius").set(
            temp_celsius)

        return json.dumps({'success': True}), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

    except Exception as e:
        print(e)
        ref.child("users").child(uid).child("device").child("past").child(time_stamp).child("event_name").set(
            "Run")
        return json.dumps({'success': False, 'error': e}), 500, {'Content-Type': 'text/javascript; charset=utf-8'}


# URL for uploading a Strava activity
@api.route('/api/strava/upload/<string:uid>/<string:file_name>/', methods=['GET'])
def upload_activity(uid=None, file_name=None):
    try:

        strava_token = ref.child("users").child(uid).child("strava_token").get().val()
        strava_client.access_token = strava_token

        file_name += ".gpx"

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
        friend_request_uid_list = list(
            ref.child("friend_requests").child(uid).order_by_child("request_type").equal_to("received").get().val())

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
