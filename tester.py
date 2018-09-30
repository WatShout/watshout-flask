import requests
from flask import Flask, render_template, request, redirect, url_for, abort, Blueprint
from config import ref, storageRef, strava_client, access_token, DEBUG, BASE_ENDPOINT_URL, push_service
from helper_functions import get_cookies, get_user_entry, check_user_exists, get_weather, get_location_from_latlng
import time
import gpxpy
import gpxpy.gpx
from datetime import datetime
users = ref.child("users").get().val()

MS_TO_MINUTE = 1.6666666666667E-5

gpx = gpxpy.gpx.GPX()

# Create first track in our GPX:
gpx_track = gpxpy.gpx.GPXTrack()
gpx.tracks.append(gpx_track)

# Create first segment in our GPX track:
gpx_segment = gpxpy.gpx.GPXTrackSegment()
gpx_track.segments.append(gpx_segment)

data = ref.child("users").get().val()

reg_ids = []

for key, value in data.items():
    try:
        current = value['device']['current']
        reg_ids.append(value['fcm_token'])

    except KeyError:
        pass

print(reg_ids)

data_message = {
    "wake": True
}

result = push_service.notify_multiple_devices(registration_ids=reg_ids,
                                              message_title="Currently Tracking Activity",
                                              message_body="Location tracking enabled",
                                              collapse_key="wake")
