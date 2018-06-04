from flask import Flask, render_template

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
ref = firebase.database()


# Note: this will eventually redirect to the 'main' page
@app.route('/')
def redirect_to_app():
    return "This will eventually be the home of the main web page"


@app.route('/app/')
def main_map():
    return app.send_static_file('main_app.html')


@app.route('/login/')
def log_in():
    return app.send_static_file('login.html')


@app.route('/users/<uid>')
def user_page(uid=None):

    # Try to display a simple page with user info
    try:
        email = ref.child("users").child(uid).get().val()['email']
        name = ref.child("users").child(uid).get().val()['name']
        age = ref.child("users").child(uid).get().val()['age']

        return render_template('user_page.html', email=email, name=name, age=age, uid=uid)

    # If user isn't found in the database we assume they don't exist
    except TypeError:
        return render_template('user_doesnt_exist.html', uid=uid)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=80, debug=False)
