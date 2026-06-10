import requests

BASE = "http://localhost:3001/api"

def login(username, password):
    r = requests.post(f"{BASE}/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["token"]

def get(token, path):
    r = requests.get(f"{BASE}{path}", headers={"Authorization": f"Bearer {token}"})
    return r.json()

token = login("cs001", "123456")

r = get(token, "/complaints?type=unlicensed_vehicle")
cid = r["data"]["items"][0]["id"]
cno = r["data"]["items"][0]["complaint_no"]
print(f"Testing evidence API for complaint: {cno} (id={cid})")

ev = get(token, f"/evidence/complaint/{cid}")
print(f"Success: {ev['success']}")
print(f"Complaint info: complaint_no={ev['data'].get('complaint',{}).get('complaint_no')}, gate_name={ev['data'].get('complaint',{}).get('gate_name')}")
print(f"Parking logs: {len(ev['data']['parking_logs'])}")
for l in ev['data']['parking_logs']:
    print(f"  - id={l['id']}, plate={l.get('plate_number')}, gate={l['gate_name']}, match_mode={l.get('match_mode')}")
print(f"Gate anomalies: {len(ev['data']['gate_anomalies'])}")
for g in ev['data']['gate_anomalies']:
    print(f"  - id={g['id']}, gate={g['gate_name']}, type={g['anomaly_type']}, match_mode={g.get('match_mode')}")
print(f"Monthly rentals: {len(ev['data']['monthly_rentals'])}")

detail = get(token, f"/complaints/{cid}")
print()
print("Comparison with detail endpoint:")
print(f"  Detail parking logs: {len(detail['data']['evidence']['parking_logs'])}")
print(f"  Evidence API parking logs: {len(ev['data']['parking_logs'])}")
print(f"  Parking logs match: {len(detail['data']['evidence']['parking_logs']) == len(ev['data']['parking_logs'])}")
print(f"  Detail gate anomalies: {len(detail['data']['evidence']['gate_anomalies'])}")
print(f"  Evidence API gate anomalies: {len(ev['data']['gate_anomalies'])}")
print(f"  Gate anomalies match: {len(detail['data']['evidence']['gate_anomalies']) == len(ev['data']['gate_anomalies'])}")
