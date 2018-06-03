from flask import Flask, render_template, redirect
from flask_talisman import Talisman

import pyrebase

csp = {
    'default-src': [
        '*.gstatic.com',
        '*.googleapis.com',
        '*.firebase.com',
        '*.watshout-app.appspot.com',
        '\'self\'',
        '*.firebaseio.com'
    ],
    'script-src': [
        '*.gstatic.com',
        '*.googleapis.com',
        '*.firebase.com',
        '*.watshout-app.appspot.com',
        '\'self\'',
        '*.firebaseio.com',
        '*.google.com',
        '\'unsafe-inline\''

    ],
    'style-src': [
        '\'self\'',
        '*.firebase.com',
        '*.googleapis.com',
        '\'unsafe-inline\''
    ],
    'img-src': [
        '*.gstatic.com',
        '*.watshout-app.appspot.com',
        '*.googleapis.com',
        '*.watshout-flask.herokuapp.com'
    ],
    'font-src': [
        '*.gstatic.com'
    ],
    'connect-src': [
        '*.firebaseio.com',
        '*.googleapis.com',
        'wss://s-usc1c-nss-238.firebaseio.com'
    ],
    'frame-src': [
        '*.accountchooser.com',
        '*.firebaseio.com',
        '*.firebaseapp.com'
    ]

}

app = Flask(__name__, static_url_path="/static")

# Note: make sure content_security_policy=csp when deploying to production
# if testing locally you can take it out
Talisman(app, content_security_policy=csp)

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


# Note: this will eventually redirect to the 'main' page
@app.route('/')
def redirect_to_app():
    return "This will eventually be the home of the main web page"


@app.route('/app/')
def main_map():
    return app.send_static_file('index.html')


@app.route('/login/')
def log_in():
    return app.send_static_file('login/index.html')


@app.route('/users/<uid>')
def user_page(uid=None):

    # Try to display a simple page with user info
    try:
        email = db.child("users").child(uid).get().val()['email']
        name = db.child("users").child(uid).get().val()['name']
        age = db.child("users").child(uid).get().val()['age']

        return render_template('user_page.html', email=email, name=name, age=age, uid=uid)

    # If user isn't found in the database we assume they don't exist
    except TypeError:
        return render_template('user_doesnt_exist.html', uid=uid)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=80, debug=True)
