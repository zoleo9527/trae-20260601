import urllib.request, json

BASE = "http://127.0.0.1:8080/api"

def api(method, path, body=None):
    url = f"{BASE}{path}"
    if method == "GET":
        r = urllib.request.urlopen(url).read()
        return json.loads(r)
    data = json.dumps(body).encode() if body else b''
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    r = urllib.request.urlopen(req).read()
    return json.loads(r)

print("=" * 70)
print("  修复验证：退回原因取值逻辑")
print("=" * 70)

# ---- 场景A：案件2 (need_supplement) — 补样退回 ----
print("\n■ 场景A：案件2 补样退回")
d = api("GET", "/record/2")
r2 = d["data"]["basic"]["responsibility"]
has_missing = "缺项" in r2["latest_reject_reason"]
has_expert = "鉴定人说明" in r2["latest_reject_reason"]
no_status_text = "发起补样通知" not in r2["latest_reject_reason"]
print(f"  退回原因: {r2['latest_reject_reason'][:80]}...")
print(f"  含缺项: {'✓' if has_missing else '✗'}  含鉴定人说明: {'✓' if has_expert else '✗'}  非状态文案: {'✓' if no_status_text else '✗'}")

results_a = {}
for label, path in [("待办", "/todo?role=clerk"), ("列表", "/records"), ("详情", "/record/2")]:
    d = api("GET", path)
    if label == "待办":
        for t in d["data"]["todos"]:
            if t["record_id"] == 2:
                r = t["responsibility"]
                break
    elif label == "列表":
        for rec in d["data"]:
            if rec["id"] == 2:
                r = rec["responsibility"]
                break
    else:
        r = d["data"]["basic"]["responsibility"]
    results_a[label] = r["latest_reject_reason"]
all_same_a = len(set(results_a.values())) == 1
print(f"  三处一致: {'✓' if all_same_a else '✗'}")

# ---- 场景B：案件1 (rejected_qc) — 质控退回 ----
print("\n■ 场景B：案件1 质控退回")
d = api("GET", "/record/1")
r1 = d["data"]["basic"]["responsibility"]
is_real_reason = "特征比对表" in r1["latest_reject_reason"]
is_not_status_text = "→" not in r1["latest_reject_reason"]
print(f"  退回原因: {r1['latest_reject_reason']}")
print(f"  真实质控原因: {'✓' if is_real_reason else '✗'}  非状态文案: {'✓' if is_not_status_text else '✗'}")

results_b = {}
for label, path in [("待办", "/todo?role=expert"), ("列表", "/records"), ("详情", "/record/1")]:
    d = api("GET", path)
    if label == "待办":
        for t in d["data"]["todos"]:
            if t["record_id"] == 1:
                r = t["responsibility"]
                break
    elif label == "列表":
        for rec in d["data"]:
            if rec["id"] == 1:
                r = rec["responsibility"]
                break
    else:
        r = d["data"]["basic"]["responsibility"]
    results_b[label] = r["latest_reject_reason"]
all_same_b = len(set(results_b.values())) == 1
print(f"  三处一致: {'✓' if all_same_b else '✗'}")

# ---- 场景C：案件3 (archived) — 无退回 ----
print("\n■ 场景C：案件3 已归档（无退回）")
d = api("GET", "/record/3")
r3 = d["data"]["basic"]["responsibility"]
print(f"  退回原因: '{r3['latest_reject_reason']}' (应为空)")
no_reject = r3["latest_reject_reason"] == ""
print(f"  无退回原因: {'✓' if no_reject else '✗'}")

print("\n" + "=" * 70)
a_ok = has_missing and has_expert and no_status_text and all_same_a
b_ok = is_real_reason and is_not_status_text and all_same_b
c_ok = no_reject
print(f"  场景A（补样退回→取缺项+鉴定人说明）: {'✓ 通过' if a_ok else '✗ 未通过'}")
print(f"  场景B（质控退回→取真实 reject_reason）: {'✓ 通过' if b_ok else '✗ 未通过'}")
print(f"  场景C（已归档→无退回原因）: {'✓ 通过' if c_ok else '✗ 未通过'}")
print("=" * 70)
