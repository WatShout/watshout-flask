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

    db_values = db.child("uses").child(uid).get().val()

    if db_values is not None:
        email = db_values['email']
        name = db_values['name']
        return render_template('user_page.html', email=email, name=name, uid=uid)

    else:
        return render_template('user_doesnt_exist.html', uid=uid)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
