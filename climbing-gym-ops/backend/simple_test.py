import subprocess
import time
import urllib.request
import json
import os
os.system('killall -9 node 2>/dev/null')
time.sleep(1)
proc = subprocess.Popen(['node', 'server.js'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3)
def get(url):
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read().decode())
print('Testing...')
h = get('http://localhost:3001/api/health')
print('Health:', h['status'])
