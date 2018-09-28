from flask import Flask
from webapp import web_app
from api import api
from cookies import cookies
from config import DEBUG
from coming_soon import coming_soon
from flask_sslify import SSLify

app = Flask(__name__, static_url_path="/static")

#if not DEBUG:
    #sslify = SSLify(app, skips=['/api/deleteidleruns/'])

#app.register_blueprint(web_app)
#app.register_blueprint(cookies)
app.register_blueprint(coming_soon)
app.register_blueprint(api)
