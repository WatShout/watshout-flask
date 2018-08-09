from flask import Flask
from webapp import web_app
from api import api
from cookies import cookies
from config import DEBUG
from flask_sslify import SSLify

app = Flask(__name__, static_url_path="/static")

if not DEBUG:
    sslify = SSLify(app)

app.register_blueprint(web_app)
app.register_blueprint(api)
app.register_blueprint(cookies)
