import requests
BASE = "http://localhost:8001"

r = requests.post(f"{BASE}/regions/", json={"code":"DBG2-A","name":"A","target_capacity":100})
ra = r.json()["id"]
r = requests.post(f"{BASE}/vehicles/", json={"bike_code":"DBG2-1","model":"T","current_region_id":ra})
v1 = r.json()["id"]
r = requests.post(f"{BASE}/faults/", json={"vehicle_id":v1,"fault_type":"f1","reporter":"t","region_id":ra})
f1 = r.json()["id"]
r = requests.post(f"{BASE}/inbound/batches/", json={"source_region_id":ra,"repair_station":"test","items":[{"vehicle_id":v1,"fault_id":f1}]})
r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id":v1,"latest_only":"true"})
o1 = r.json()[0]["id"]
r = requests.post(f"{BASE}/repair/orders/{o1}/complete", json={"repair_note":"ok"})
print("1. order after complete:", r.json()["status"])

r = requests.post(f"{BASE}/deployments/batch/", json={"target_region_id":ra,"items":[{"vehicle_id":v1,"repair_order_id":o1}]})
dep = r.json()[0]
dep_id = dep["id"]
print("2. vehicle after deploy:", dep["vehicle"]["status"])

r = requests.post(f"{BASE}/feedback/", json={"region_id":ra,"deployment_id":dep_id,"feedback_type":"ISSUE","description":"test","reporter":"mgr"})
fb_id = r.json()["id"]
print("3. feedback id:", fb_id)

r = requests.get(f"{BASE}/vehicles/")
v1_status = [v for v in r.json() if v["id"] == v1][0]["status"]
print("4. vehicle after ISSUE feedback:", v1_status)

r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id":v1,"latest_only":"true"})
order_status = r.json()[0]["status"]
print("5. order after ISSUE feedback:", order_status)

r = requests.post(f"{BASE}/repair/orders/{o1}/complete", json={"repair_note":"re-repair ok"})
print("6. order after re-complete:", r.json()["status"])

r = requests.get(f"{BASE}/feedback/", params={"deployment_id":dep_id})
fb = r.json()[0]
print("7. feedback after re-complete: resolved=%s resolved_by=%s resolved_at=%s" % (fb["resolved"], fb["resolved_by"], fb["resolved_at"]))

r = requests.post(f"{BASE}/deployments/batch/", json={"target_region_id":ra,"items":[{"vehicle_id":v1,"repair_order_id":o1}]})
print("8. re-deploy after feedback resolved:", r.status_code)

r = requests.get(f"{BASE}/feedback/", params={"resolved":"true"})
print("9. resolved feedbacks:", [f["id"] for f in r.json()])

