import pyrebase
from stravalib.client import Client
from pyfcm import FCMNotification

push_service = FCMNotification(api_key="AAAAlg9flck:APA91bG_O_Thp_7rLL-pINzrbL_MOZvws2bE25EfUt7pDWZY5cfyce6P3kidGqRr2VQRUCDUSBTJtdpJc33V0s7kUlMdRpumwLg-m2W32H69BztbdZgGnJH6TvQUhjbVIv7HncLrFMW69ot6pkPWDJTsRycUEkWqBA")

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

DEBUG = False

BASE_ENDPOINT_URL = "https://watshout-test.appspot.com"

BASE_CREATE_MAP_URL = "https://maps.googleapis.com/maps/api/staticmap?&size=600x300&maptype=roadmap&key=AIzaSyAxkvxOLITaJbTjnNXxDzDAwRyZaWD0D4s&sensor=true&path=color:0xff0000ff|enc:"


