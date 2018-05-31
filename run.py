from flask import Flask
from flask import render_template
import pyrebase

app = Flask(__name__, static_url_path="/static")

# Note: Everything is authenticated because of the service account
config = {
  "apiKey": "AIzaSyCEFFfLVU_lFaUt8bYL0E0zYtkeYsepU4A",
  "authDomain": "watshout-app.firebaseapp.com",
  "databaseURL": "https://watshout-app.firebaseio.com",
  "projectID": "watshout-app",
  "storageBucket": "",
  "serviceAccount": "serviceAccountCredentials.json"
}

firebase = pyrebase.initialize_app(config)

# Get a reference to the database service
db = firebase.database()


@app.route('/')
def main_map():
    return app.send_static_file('index.html')


@app.route('/login/')
def log_in():
    return app.send_static_file('login/index.html')


@app.route('/users/<uid>')
def user_page(uid=None):

    email = db.child("users").child(uid).get().val()['email']
    name = db.child("users").child(uid).get().val()['name']

    uid = str(uid)

    return render_template('user_page.html', email=email, name=name, uid=uid)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
