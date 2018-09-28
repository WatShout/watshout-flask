from flask import Flask, Blueprint

app = Flask(__name__, static_url_path="/static")

coming_soon = Blueprint('coming_soon', __name__)


@coming_soon.route('/')
def coming_soon_endpoint():
    return app.send_static_file("coming_soon.html")
