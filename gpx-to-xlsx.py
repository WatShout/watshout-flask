from xml.dom import minidom
import dateutil.parser as dp
import calendar
from datetime import datetime
import dateutil

# parse an xml file by name
mydoc = minidom.parse('gpx-from-android-app.gpx')

trkpt = mydoc.getElementsByTagName('trkpt')
time = mydoc.getElementsByTagName('time')
ele = mydoc.getElementsByTagName('ele')

lats = []
longs = []
times = []
eles = []


def iso_to_epoch(time):
    return calendar.timegm(dateutil.parser.parse(time).timetuple())

for elem in trkpt:
    lats.append(elem.attributes['lat'].value)
    longs.append(elem.attributes['lon'].value)

for elem in time:
    times.append(elem.firstChild.data)

times.pop(0)
base_time = iso_to_epoch(times[0])

time_differences = []

for item in times:
    time_differences.append(iso_to_epoch(item) - base_time)

for elem in ele:
    eles.append(elem.firstChild.data)



print(time_differences)