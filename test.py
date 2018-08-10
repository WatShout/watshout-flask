from config import ref

uid = "58dxX8hxhScexz2ugdl4BwZTQa72"

try:
    friend_uid_list = list(ref.child("friend_data").child(uid).get().val().items())
except AttributeError:
    friend_uid_list = []

data = {"friends": []}

for uid, since in friend_uid_list:
    name = ref.child("users").child(uid).child("name").get().val()
    profile_pic_format = ref.child("users").child(uid).child("profile_pic_format").get().val()
    uid = uid

    data["friends"].append({
        "name": name,
        "uid": uid,
        "since": since
    })

print(data)