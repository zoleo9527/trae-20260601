import requests

BASE = "http://localhost:8002"

print("=" * 60)
print("1. Database only has 6 init_data samples")
print("=" * 60)
r = requests.get(f"{BASE}/api/allocations")
items = r.json()["data"]["items"]
print(f"Total allocations: {len(items)}")
for a in items:
    print(f"  {a['allocation_no']} | status={a['status']} | verifications={len(a['verifications'])}")

print()
print("=" * 60)
print("2. Timeline stats: verified NOT counted as disputed")
print("=" * 60)
r = requests.get(f"{BASE}/api/reviews/timeline")
titems = r.json()["data"]["items"]
total = len(titems)
disputed = [t for t in titems if t["allocation_status"] == "disputed"]
verified = [t for t in titems if t["allocation_status"] == "verified"]
modified = [t for t in titems if t["is_modified"]]
print(f"Total: {total}")
print(f"Disputed (allocation_status=disputed): {len(disputed)}")
print(f"Verified (allocation_status=verified): {len(verified)}")
print(f"Modified (is_modified): {len(modified)}")

ok = True
if len(disputed) != 0:
    print(f"FAIL: disputed should be 0, got {len(disputed)}")
    ok = False
if len(verified) != 2:
    print(f"FAIL: verified should be 2, got {len(verified)}")
    ok = False
if total != 6:
    print(f"FAIL: total should be 6, got {total}")
    ok = False
if ok:
    print("PASS: Stats correct - disputed=0, verified=2, total=6")

print()
print("=" * 60)
print("3. Pending reviews list does NOT contain verified")
print("=" * 60)
r = requests.get(f"{BASE}/api/reviews/pending")
pitems = r.json()["data"]["items"]
statuses = set(a["status"] for a in pitems)
print(f"Pending count: {len(pitems)}")
print(f"Statuses: {statuses}")
if "verified" not in statuses:
    print("PASS: verified not in pending list")
else:
    print("FAIL: verified should not be in pending list")

print()
print("=" * 60)
print("4. Verification records have verifier_name")
print("=" * 60)
for a in items:
    for vf in a.get("verifications", []):
        name = vf.get("verifier_name")
        conclusion = vf.get("conclusion")
        print(f"  {a['allocation_no']} -> conclusion={conclusion}, verifier_name={name}")
        if not name:
            print(f"FAIL: verifier_name is empty for {a['allocation_no']}")
            ok = False
if ok:
    print("PASS: All verification records have verifier_name")

print()
if ok:
    print("ALL CHECKS PASSED")
else:
    print("SOME CHECKS FAILED")
