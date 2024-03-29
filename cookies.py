from flask import make_response, Blueprint

cookies = Blueprint('cookies', __name__)


@cookies.route('/cookies/set_location/<string:coords>/')
def set_default_location(coords=None):

    lat = coords.split(',')[0]
    lng = coords.split(',')[1]

    res = make_response()
    res.set_cookie('last_latitude', lat, max_age=60 * 60 * 24 * 7 * 365)
    res.set_cookie('last_longitude', lng, max_age=60 * 60 * 24 * 7 * 365)

    return res


# Creates a verified cookie for user
@cookies.route('/cookies/verified/create/')
def create_verification_cookie():
    res = make_response()
    res.set_cookie('verified', 'true', max_age=60 * 60 * 24 * 7 * 365)
    return res


# Creates UID cookie for user
@cookies.route('/cookies/uid/create/<string:uid>')
def create_uid_cookie(uid=None):
    res = make_response()
    res.set_cookie('uid', uid, max_age=60 * 60 * 24 * 7 * 365)
    return res


# Deletes cookie upon logout
@cookies.route('/cookies/delete/<string:uid>')
def delete_uid_cookie(uid=None):
    res = make_response()
    res.set_cookie('uid', uid, max_age=0)
    res.set_cookie('verified', 'true', max_age=0)
    return res
