import pyrebase
from pyfcm import FCMNotification
import googlemaps

push_service = FCMNotification(api_key="AAAAGQJsXYU:APA91bHTafwGlu-1hBUBCS3mLLdntk_i2YwnSWXxU7eiU-7O7k05Baui" +
                                       "Apptdd-ENFeOHGL62tOx57USNw2WAvSsYg-hwqnuY3r73MOyMBB3fa-VBvqoIcRM-ZJN" +
                                       "nvachiOM5f96SoUeFlxp6UM5xRD3mKIGJvW9CA")

gmaps = googlemaps.Client(key="AIzaSyAxkvxOLITaJbTjnNXxDzDAwRyZaWD0D4s")

# Note: Everything is authenticated because of the service account
config = {
    "apiKey": "AIzaSyDgoFIn4pMSsadqDj5adc8V58Ct_MeNjmU",
    "authDomain": "watshout-cloud.firebaseapp.com",
    "databaseURL": "https://watshout-cloud.firebaseio.com",
    "projectId": "watshout-cloud",
    "storageBucket": "watshout-cloud.appspot.com",
    "messagingSenderId": "107414838661",
    "serviceAccount": "service_account_credentials.json"
}


firebase = pyrebase.initialize_app(config)

# Get a reference to the database service
ref = firebase.database()
storageRef = firebase.storage()

# access_token = "9060508203575f2d01595d8723b1f87cff39706a"

DEBUG = False

BASE_ENDPOINT_URL = "https://watshout-cloud.appspot.com"

BASE_CREATE_MAP_URL = \
    "https://maps.googleapis.com/maps/api/staticmap?&size=600x300" + \
    "&maptype=roadmap&key=AIzaSyAxkvxOLITaJbTjnNXxDzDAwRyZaWD0D4s&sensor=true&path=color:0xff0000ff|enc:"
