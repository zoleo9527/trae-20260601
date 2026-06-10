import requests
import json

BASE = "http://localhost:8001"

passed = 0
failed = 0

def test(label, r, expected_status=200, check_fn=None):
    global passed, failed
    ok = r.status_code == expected_status
    fail_reason = ""
    if ok and check_fn:
        ok, fail_reason = check_fn(r.json())
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"[{status}] {label} (HTTP {r.status_code})")
    if not ok:
        if fail_reason:
            print(f"    reason: {fail_reason}")
        else:
            print(f"    expected: {expected_status}, got: {r.status_code}")
        try:
            print(f"    body: {json.dumps(r.json(), ensure_ascii=False)[:200]}")
        except:
            pass
    return ok

def setup_vehicle(region_id, index):
    code = f"V5-{index:03d}"
    r = requests.post(f"{BASE}/vehicles/", json={"bike_code": code, "model": "T", "current_region_id": region_id})
    vid = r.json()["id"]
    r = requests.post(f"{BASE}/faults/", json={"vehicle_id": vid, "fault_type": f"fault{index}", "reporter": "t", "region_id": region_id})
    fid = r.json()["id"]
    r = requests.post(f"{BASE}/inbound/batches/", json={"source_region_id": region_id, "repair_station": "V5Repair", "items": [{"vehicle_id": vid, "fault_id": fid}]})
    r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": vid, "latest_only": "true"})
    oid = r.json()[0]["id"]
    return vid, fid, oid

def deploy_and_complete(region_id, vid, oid):
    r = requests.post(f"{BASE}/repair/orders/{oid}/complete", json={"repair_note": "fixed"})
    r = requests.post(f"{BASE}/deployments/batch/", json={"target_region_id": region_id, "items": [{"vehicle_id": vid, "repair_order_id": oid}]})
    return r.json()[0]["id"]

# ===== Setup =====
print("=== Setup ===")
r = requests.post(f"{BASE}/regions/", json={"code": "V5-A", "name": "A", "target_capacity": 100})
ra = r.json()["id"]; test("create region A", r)
r = requests.post(f"{BASE}/regions/", json={"code": "V5-B", "name": "B", "target_capacity": 50})
rb = r.json()["id"]; test("create region B", r)

v1, f1, o1 = setup_vehicle(ra, 1); test("setup vehicle 1", r)
v2, f2, o2 = setup_vehicle(ra, 2); test("setup vehicle 2", r)
v3, f3, o3 = setup_vehicle(ra, 3); test("setup vehicle 3", r)
v4, f4, o4 = setup_vehicle(ra, 4); test("setup vehicle 4", r)

dep1 = deploy_and_complete(rb, v1, o1); test("deploy v1 to B", r)
dep2 = deploy_and_complete(rb, v2, o2); test("deploy v2 to B", r)
dep3 = deploy_and_complete(rb, v3, o3); test("deploy v3 to B", r)
dep4 = deploy_and_complete(rb, v4, o4); test("deploy v4 to B", r)

# ===== Path A: ISSUE feedback -> reflow -> re-complete -> auto-resolve -> re-deploy =====
print("\n=== Path A: ISSUE feedback -> auto-resolve on re-complete -> re-deploy ===")

r = requests.post(f"{BASE}/feedback/", json={"region_id": rb, "deployment_id": dep1, "feedback_type": "ISSUE", "description": "tire still bad", "reporter": "mgr"})
fb1_id = r.json()["id"]
test("A1: submit ISSUE feedback", r, check_fn=lambda d: (True,"") if d["resolved"] is False else (False, f"resolved={d['resolved']}"))

r = requests.get(f"{BASE}/vehicles/")
v1_status = [v for v in r.json() if v["id"] == v1][0]["status"]
test("A2: vehicle IN_REPAIR after ISSUE feedback", r, check_fn=lambda d: (True,"") if v1_status=="IN_REPAIR" else (False, f"status={v1_status}"))

r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": v1, "latest_only": "true"})
test("A3: order PENDING after ISSUE feedback", r, check_fn=lambda d: (True,"") if d[0]["status"]=="PENDING" else (False, f"status={d[0]['status']}"))

# try to re-deploy with unresolved feedback -> should fail
r = requests.post(f"{BASE}/deployments/batch/", json={"target_region_id": rb, "items": [{"vehicle_id": v1, "repair_order_id": o1}]})
test("A4: re-deploy blocked by unresolved feedback", r, expected_status=400)

# re-complete the repair -> should auto-resolve feedback
r = requests.post(f"{BASE}/repair/orders/{o1}/complete", json={"repair_note": "re-repair done", "mechanic": "tech"})
test("A5: re-complete repair", r, check_fn=lambda d: (True,"") if d["status"]=="COMPLETED" else (False, f"status={d['status']}"))

r = requests.get(f"{BASE}/feedback/", params={"deployment_id": dep1})
fb1 = r.json()[0]
def check_auto_resolve(d):
    fb = d[0]
    if fb["resolved"] is not True:
        return False, f"resolved={fb['resolved']}"
    if fb["resolved_by"] is None or "system" not in fb["resolved_by"]:
        return False, f"resolved_by={fb['resolved_by']}"
    if fb["resolved_at"] is None:
        return False, "resolved_at is None"
    return True, ""
test("A6: feedback auto-resolved after re-complete", r, check_fn=check_auto_resolve)

# now re-deploy should succeed
r = requests.post(f"{BASE}/deployments/batch/", json={"target_region_id": rb, "items": [{"vehicle_id": v1, "repair_order_id": o1}]})
test("A7: re-deploy after feedback resolved", r, expected_status=200)

# ===== Path B: review ISSUE_FOUND -> reflow -> re-complete -> no feedback lock -> re-deploy =====
print("\n=== Path B: review ISSUE_FOUND -> re-complete -> re-deploy (no feedback) ===")

r = requests.post(f"{BASE}/deployments/{dep2}/review", json={"status": "ISSUE_FOUND", "review_note": "pedal loose", "reviewer": "mgr"})
test("B1: review ISSUE_FOUND", r, check_fn=lambda d: (True,"") if d["vehicle"]["status"]=="IN_REPAIR" else (False, f"status={d['vehicle']['status']}"))

r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": v2, "latest_only": "true"})
test("B2: order PENDING after review issue", r, check_fn=lambda d: (True,"") if d[0]["status"]=="PENDING" else (False, f"status={d[0]['status']}"))

# no ISSUE feedback for v2, so after re-complete it can be deployed directly
r = requests.post(f"{BASE}/repair/orders/{o2}/complete", json={"repair_note": "re-repair done"})
test("B3: re-complete v2 repair", r)

r = requests.post(f"{BASE}/deployments/batch/", json={"target_region_id": rb, "items": [{"vehicle_id": v2, "repair_order_id": o2}]})
test("B4: re-deploy v2 after re-complete (no feedback lock)", r, expected_status=200)

# ===== Path C: ISSUE feedback -> manual resolve -> re-deploy =====
print("\n=== Path C: ISSUE feedback -> manual resolve -> re-deploy ===")

r = requests.post(f"{BASE}/feedback/", json={"region_id": rb, "deployment_id": dep3, "feedback_type": "ISSUE", "description": "brake issue", "reporter": "mgr"})
fb3_id = r.json()["id"]
test("C1: submit ISSUE feedback for v3", r)

# re-complete repair -> auto-resolve
r = requests.post(f"{BASE}/repair/orders/{o3}/complete", json={"repair_note": "re-repair done"})
test("C2: re-complete v3 repair", r)

# feedback should be auto-resolved
r = requests.get(f"{BASE}/feedback/", params={"deployment_id": dep3})
test("C3: feedback auto-resolved", r, check_fn=lambda d: (True,"") if d[0]["resolved"] is True else (False, f"resolved={d[0]['resolved']}"))

r = requests.post(f"{BASE}/deployments/batch/", json={"target_region_id": rb, "items": [{"vehicle_id": v3, "repair_order_id": o3}]})
test("C4: re-deploy v3 after feedback resolved", r, expected_status=200)

# ===== Path D: manual resolve feedback (without re-complete) =====
print("\n=== Path D: manual resolve feedback ===")

r = requests.post(f"{BASE}/feedback/", json={"region_id": rb, "deployment_id": dep4, "feedback_type": "ISSUE", "description": "chain issue", "reporter": "mgr"})
fb4_id = r.json()["id"]
test("D1: submit ISSUE feedback for v4", r)

# manual resolve (e.g. manager decides it was a false alarm or already handled elsewhere)
r = requests.post(f"{BASE}/feedback/{fb4_id}/resolve", json={"resolved_by": "supervisor_wang"})
def check_manual(d):
    if d["resolved"] is not True:
        return False, f"resolved={d['resolved']}"
    if d["resolved_by"] != "supervisor_wang":
        return False, f"resolved_by={d['resolved_by']}"
    if d["resolved_at"] is None:
        return False, "resolved_at is None"
    return True, ""
test("D2: manual resolve feedback", r, check_fn=check_manual)

# cannot resolve again
r = requests.post(f"{BASE}/feedback/{fb4_id}/resolve", json={"resolved_by": "supervisor_wang"})
test("D3: cannot resolve already-resolved feedback", r, expected_status=400)

# CONFIRM feedback cannot be resolved
r = requests.post(f"{BASE}/feedback/", json={"region_id": rb, "deployment_id": dep4, "feedback_type": "CONFIRM", "description": "ok", "reporter": "mgr"})
confirm_fb_id = r.json()["id"]
r = requests.post(f"{BASE}/feedback/{confirm_fb_id}/resolve", json={"resolved_by": "test"})
test("D4: cannot resolve CONFIRM feedback", r, expected_status=400)

# ===== Verify: historical resolved feedback does not block deployment =====
print("\n=== Verify: historical resolved feedback does not block ===")

# v1 had ISSUE feedback that was auto-resolved, now it's been re-deployed
# it should be able to be deployed again if needed
r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": v1, "latest_only": "true"})
v1_order = r.json()[0]["id"]
r = requests.post(f"{BASE}/deployments/batch/", json={"target_region_id": ra, "items": [{"vehicle_id": v1, "repair_order_id": v1_order}]})
test("E1: v1 with historical resolved feedback can re-deploy", r, expected_status=200)

# ===== Verify: feedback list filtering =====
print("\n=== Verify: feedback list filtering ===")

r = requests.get(f"{BASE}/feedback/", params={"resolved": "false"})
test("F1: filter unresolved feedback", r, check_fn=lambda d: (True,"") if all(f["resolved"] is False for f in d) else (False, f"found resolved ones in {len(d)} results"))

r = requests.get(f"{BASE}/feedback/", params={"resolved": "true"})
test("F2: filter resolved feedback", r, check_fn=lambda d: (True,"") if all(f["resolved"] is True for f in d) else (False, "found unresolved ones"))

# ===== Verify: region mismatch still blocked =====
print("\n=== Verify: region mismatch still blocked ===")

r = requests.post(f"{BASE}/feedback/", json={"region_id": ra, "deployment_id": dep1, "feedback_type": "CONFIRM", "description": "wrong region", "reporter": "mgr"})
test("G1: feedback with wrong region blocked", r, expected_status=400)

# ===== Verify: unresolved feedback still blocks =====
print("\n=== Verify: unresolved feedback still blocks deployment ===")

# deploy another vehicle, submit ISSUE feedback, don't resolve
v5, f5, o5 = setup_vehicle(ra, 5)
dep5 = deploy_and_complete(rb, v5, o5)
r = requests.post(f"{BASE}/feedback/", json={"region_id": rb, "deployment_id": dep5, "feedback_type": "ISSUE", "description": "test", "reporter": "mgr"})
test("H1: submit ISSUE feedback for v5", r)

# try to deploy v5 with unresolved feedback
r = requests.post(f"{BASE}/deployments/batch/", json={"target_region_id": rb, "items": [{"vehicle_id": v5, "repair_order_id": o5}]})
test("H2: deploy blocked by unresolved feedback", r, expected_status=400,
     check_fn=lambda d: (True,"") if "异常反馈" in d.get("detail","") else (False, f"detail={d.get('detail','')}"))

# ===== Summary =====
print("\n" + "="*60)
print(f"Result: {passed} passed, {failed} failed")
if failed == 0:
    print("All tests passed!")
else:
    print("Some tests FAILED!")
