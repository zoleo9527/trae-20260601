import requests
import json

BASE = "http://localhost:3001/api"

def login(username, password):
    r = requests.post(f"{BASE}/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["token"]

def get(token, path):
    r = requests.get(f"{BASE}{path}", headers={"Authorization": f"Bearer {token}"})
    return r.json()

def post(token, path, data):
    r = requests.post(f"{BASE}{path}", json=data, headers={"Authorization": f"Bearer {token}"})
    return r.json()

def patch(token, path, data):
    r = requests.patch(f"{BASE}{path}", json=data, headers={"Authorization": f"Bearer {token}"})
    return r.json()

token = login("cs001", "123456")
print("=== Test 1: List unlicensed_vehicle complaints ===")
r = get(token, "/complaints?type=unlicensed_vehicle")
for c in r["data"]["items"]:
    print(f"  {c['complaint_no']}: plate={c.get('plate_number')}, gate={c.get('gate_name')}, incident={c.get('incident_time')}, appeal={c.get('appeal_reason')}")

print("\n=== Test 2: Detail of unlicensed complaint with evidence matching ===")
cid = r["data"]["items"][0]["id"]
d = get(token, f"/complaints/{cid}")["data"]
print(f"  Complaint: {d['complaint_no']}")
print(f"  Description: {d['description']}")
print(f"  Appeal Reason: {d.get('appeal_reason')}")
print(f"  Plate: {d.get('plate_number')}")
print(f"  Gate: {d.get('gate_name')} ({d.get('gate_id')})")
print(f"  Incident Time: {d.get('incident_time')}")
print(f"  Parking Logs matched: {len(d['evidence']['parking_logs'])}")
for l in d['evidence']['parking_logs']:
    print(f"    - id={l['id']}, plate={l.get('plate_number')}, gate={l['gate_name']}, time={l['timestamp']}, match_mode={l.get('match_mode')}")
print(f"  Gate Anomalies matched: {len(d['evidence']['gate_anomalies'])}")
for g in d['evidence']['gate_anomalies']:
    print(f"    - id={g['id']}, gate={g['gate_name']}, type={g['anomaly_type']}, time={g['detected_at']}, match_mode={g.get('match_mode')}")

print("\n=== Test 3: Detail of appealing complaint with separate appeal_reason ===")
r = get(token, "/complaints?status=appealing")
cid = r["data"]["items"][0]["id"]
d = get(token, f"/complaints/{cid}")["data"]
print(f"  Complaint: {d['complaint_no']}")
print(f"  Status: {d['status']}")
print(f"  Original Description: {d['description']}")
print(f"  Appeal Reason (separate field): {d.get('appeal_reason')}")
print(f"  Appealed At: {d.get('appealed_at')}")

print("\n=== Test 4: Create new complaint via POST ===")
from datetime import datetime, timedelta
deadline = (datetime.now() + timedelta(days=1)).isoformat()
new_c = post(token, "/complaints", {
    "type": "unlicensed_vehicle",
    "plate_number": None,
    "description": "API测试: B区发现一辆无牌照黑色轿车强行闯闸",
    "parking_lot_id": 1,
    "deadline": deadline,
    "incident_time": "2026-06-10 14:00:00",
    "gate_id": 3,
    "gate_name": "B区入口",
})
print(f"  Created: {new_c['success']}, complaint_no={new_c['data']['complaint_no']}, id={new_c['data']['id']}")
print(f"  gate_id={new_c['data'].get('gate_id')}, gate_name={new_c['data'].get('gate_name')}, incident_time={new_c['data'].get('incident_time')}")

print("\n=== Test 5: Submit appeal reason (separate from description) ===")
cid = new_c['data']['id']
p = patch(token, f"/complaints/{cid}", {
    "status": "processing",
})
print(f"  Set to processing: {p['success']}")
p = patch(token, f"/complaints/{cid}", {
    "status": "appealing",
    "appealReason": "车主自称是月租用户但未带车牌，要求核查月租名单中的车主信息",
})
d = get(token, f"/complaints/{cid}")["data"]
print(f"  Appealed: {p['success']}")
print(f"  Original Description preserved: {d['description']}")
print(f"  Appeal Reason (separate field): {d.get('appeal_reason')}")
print(f"  Appealed At: {d.get('appealed_at')}")

print("\n=== Test 6: Timeline shows appeal event ===")
for t in d['timeline']:
    print(f"  {t['created_at']}: {t['operator_name']} - {t['action']} - {t['detail']}")
