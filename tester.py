import requests
from flask import Flask, render_template, request, redirect, url_for, abort, Blueprint
from config import ref, storageRef, strava_client, access_token, DEBUG, BASE_ENDPOINT_URL
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

data = ref.child("users").child("E187uGxH7kVVfPLZykO0Lm5NLFk2").child("device").child("current").get().val()

for key, value in data.items():
    formatted_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(value["time"]))
    datetime_object = datetime.strptime(formatted_time, '%Y-%m-%d %H:%M:%S')
    gpx_segment.points.append(gpxpy.gpx.GPXTrackPoint(latitude=value["lat"], longitude=value["lon"], time=datetime_object))

print("Cretaed GPX: " , gpx.to_xml())