import pyrebase
from stravalib.client import Client

# Note: Everything is authenticated because of the service account
config = {
    "apiKey": "AIzaSyDyP50TBSm5yugoczwXY4tXpJ_KMtP5Djo",
    "authDomain": "watshout-test.firebaseapp.com",
    "databaseURL": "https://watshout-test.firebaseio.com",
    "projectID": "watshout-test",
    "storageBucket": "watshout-test.appspot.com",
    "serviceAccount": "service_account_credentials.json"
}

firebase = pyrebase.initialize_app(config)

# Get a reference to the database service
ref = firebase.database()
storageRef = firebase.storage()

strava_client = Client()
access_token = None

DEBUG = True

BASE_ENDPOINT_URL = "https://watshout-test.appspot.com"

BASE_CREATE_MAP_URL = "https://maps.googleapis.com/maps/api/staticmap?&size=600x300&maptype=roadmap&key=AIzaSyAxkvxOLITaJbTjnNXxDzDAwRyZaWD0D4s&sensor=true"


