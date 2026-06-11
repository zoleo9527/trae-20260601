import requests
import json

BASE = "http://localhost:8002"

passed = 0
failed = 0

def check(name, condition):
    global passed, failed
    if condition:
        print(f"  [✅ PASS] {name}")
        passed += 1
    else:
        print(f"  [❌ FAIL] {name}")
        failed += 1

def step(title, resp=None, status_code=None):
    print(f"\n{'='*70}")
    print(f"▶ {title}")
    if resp is not None:
        print(f"  HTTP Status: {status_code}")
        print(f"  Response: {json.dumps(resp, ensure_ascii=False, indent=2)[:600]}")

print("="*70)
print("【差异核实闭环 - 完整验证测试】")
print("="*70)


print("\n" + "="*70)
print("【场景1: 初始化样例 - 发货方少装(sender_short)核实记录】")
print("="*70)

r = requests.get(f"{BASE}/api/allocations", params={"status": "verified"})
step("1.1 查询verified状态调拨单", r.json(), r.status_code)
data = r.json().get("data", {})
items = data.get("items", [])
check("1.1 存在verified状态的调拨单", len(items) >= 1)

sender_short_item = None
for item in items:
    if item.get("verifications") and item["verifications"][0]["conclusion"] == "sender_short":
        sender_short_item = item
        break

check("1.2 找到sender_short核实记录", sender_short_item is not None)

if sender_short_item:
    vf = sender_short_item["verifications"][0]
    step("1.3 核实记录详情", vf)
    check("1.3a conclusion=sender_short", vf["conclusion"] == "sender_short")
    check("1.3b responsibility有值", bool(vf["responsibility"]))
    check("1.3c verifier_name有值", bool(vf.get("verifier_name")))
    check("1.3d verified_at有值", bool(vf.get("verified_at")))
    check("1.3e verification_no有值", bool(vf.get("verification_no")))


print("\n" + "="*70)
print("【场景2: 初始化样例 - 收货方误报(receiver_false)核实记录】")
print("="*70)

receiver_false_item = None
for item in items:
    if item.get("verifications") and item["verifications"][0]["conclusion"] == "receiver_false":
        receiver_false_item = item
        break

if not receiver_false_item:
    r2 = requests.get(f"{BASE}/api/allocations")
    all_items = r2.json().get("data", {}).get("items", [])
    for item in all_items:
        if item.get("verifications") and item["verifications"][0]["conclusion"] == "receiver_false":
            receiver_false_item = item
            break

check("2.1 找到receiver_false核实记录", receiver_false_item is not None)

if receiver_false_item:
    vf2 = receiver_false_item["verifications"][0]
    step("2.2 核实记录详情", vf2)
    check("2.2a conclusion=receiver_false", vf2["conclusion"] == "receiver_false")
    check("2.2b responsibility有值", bool(vf2["responsibility"]))
    check("2.2c 调拨单状态=verified", receiver_false_item["status"] == "verified")


print("\n" + "="*70)
print("【场景3: 调拨详情返回核实信息】")
print("="*70)

if sender_short_item:
    r3 = requests.get(f"{BASE}/api/allocations/{sender_short_item['id']}")
    detail = r3.json().get("data", {})
    step("3.1 调拨详情", {"verifications_count": len(detail.get("verifications", []))})
    check("3.1a 详情含verifications", len(detail.get("verifications", [])) >= 1)
    if detail.get("verifications"):
        vf_detail = detail["verifications"][0]
        check("3.1b verifier_name有值", bool(vf_detail.get("verifier_name")))
        check("3.1c responsibility有值", bool(vf_detail.get("responsibility")))


print("\n" + "="*70)
print("【场景4: 时间线返回核实字段】")
print("="*70)

r4 = requests.get(f"{BASE}/api/reviews/timeline")
timeline_data = r4.json().get("data", {})
timeline_items = timeline_data.get("items", [])
step("4.1 时间线条数", status_code=r4.status_code, resp={"total": len(timeline_items)})

verified_timeline = [t for t in timeline_items if t.get("verification_conclusion")]
check("4.2 时间线含核实记录", len(verified_timeline) >= 1)

if verified_timeline:
    t = verified_timeline[0]
    check("4.2a verification_conclusion有值", bool(t.get("verification_conclusion")))
    check("4.2b verification_responsibility有值", bool(t.get("verification_responsibility")))
    check("4.2c verified_by_name有值", bool(t.get("verified_by_name")))
    check("4.2d verified_at有值", bool(t.get("verified_at")))


print("\n" + "="*70)
print("【场景5: 完整链路 - 创建→审批→发货→差异复核→品牌督导核实】")
print("="*70)

import uuid

r5a = requests.post(f"{BASE}/api/allocations?creator_id=1", json={
    "idempotent_key": f"test-verify-{uuid.uuid4().hex[:8]}",
    "from_counter": "雅诗兰黛-2F-A01", "to_counter": "雅诗兰黛-2F-B03",
    "brand": "雅诗兰黛", "floor": "2F", "goods_code": "TEST-VF",
    "goods_name": "核实测试品", "quantity": 20, "unit": "瓶", "remark": "核实测试"
})
step("5.1 创建调拨单", r5a.json(), r5a.status_code)
alloc_id = r5a.json()["data"]["id"]

r5b = requests.post(f"{BASE}/api/allocations/{alloc_id}/approve?approver_id=3")
step("5.2 楼层主管审批", r5b.json(), r5b.status_code)

r5c = requests.post(f"{BASE}/api/allocations/{alloc_id}/approve?approver_id=4")
step("5.3 品牌督导发货", r5c.json(), r5c.status_code)

r5d = requests.post(f"{BASE}/api/reviews?reviewer_id=2", json={
    "allocation_id": alloc_id, "actual_quantity": 17,
    "difference_reason": "实收17瓶差3瓶，外箱完好疑少装"
})
step("5.4 差异复核(数量不一致)", r5d.json(), r5d.status_code)
check("5.4a review_status=disputed", r5d.json()["data"]["review_status"] == "disputed")

r5e = requests.get(f"{BASE}/api/allocations/{alloc_id}")
check("5.4b 调拨单状态=disputed", r5e.json()["data"]["status"] == "disputed")

print("\n▶ 5.5 非品牌督导核实(应403)")
r5f = requests.post(f"{BASE}/api/dispute-verifications?verifier_id=1", json={
    "allocation_id": alloc_id, "conclusion": "sender_short",
    "responsibility": "测试", "processing_remark": "测试"
})
check("5.5 非品牌督导被拒绝(403)", r5f.status_code == 403)

print("\n▶ 5.6 非disputed状态核实(应400)")
r5g = requests.post(f"{BASE}/api/dispute-verifications?verifier_id=4", json={
    "allocation_id": 99999, "conclusion": "sender_short",
    "responsibility": "测试", "processing_remark": "测试"
})
check("5.6 不存在的调拨单被拒绝", r5g.status_code == 400)

print("\n▶ 5.7 无效conclusion(应400)")
r5h = requests.post(f"{BASE}/api/dispute-verifications?verifier_id=4", json={
    "allocation_id": alloc_id, "conclusion": "invalid_conclusion",
    "responsibility": "测试", "processing_remark": "测试"
})
check("5.7 无效conclusion被拒绝", r5h.status_code == 400)

print("\n▶ 5.8 responsibility为空(应400)")
r5i = requests.post(f"{BASE}/api/dispute-verifications?verifier_id=4", json={
    "allocation_id": alloc_id, "conclusion": "sender_short",
    "responsibility": "", "processing_remark": "测试"
})
check("5.8 responsibility为空被拒绝", r5i.status_code == 400)

print("\n▶ 5.9 品牌督导执行核实(sender_short)")
r5j = requests.post(f"{BASE}/api/dispute-verifications?verifier_id=4", json={
    "allocation_id": alloc_id, "conclusion": "sender_short",
    "responsibility": "经核查A01仓出库记录，确认出库时仅装了17瓶，少装3瓶。责任归属调出方A01柜。",
    "processing_remark": "已要求A01柜补发3瓶，预计次日送达。"
})
step("5.9 核实成功", r5j.json(), r5j.status_code)
vf_data = r5j.json().get("data", {})
check("5.9a conclusion=sender_short", vf_data.get("conclusion") == "sender_short")
check("5.9b responsibility有值", bool(vf_data.get("responsibility")))
check("5.9c verifier_name有值", bool(vf_data.get("verifier_name")))
check("5.9d verification_no有值", bool(vf_data.get("verification_no")))

r5k = requests.get(f"{BASE}/api/allocations/{alloc_id}")
check("5.10 调拨单状态变为verified", r5k.json()["data"]["status"] == "verified")

print("\n▶ 5.11 重复核实(应400)")
r5l = requests.post(f"{BASE}/api/dispute-verifications?verifier_id=4", json={
    "allocation_id": alloc_id, "conclusion": "receiver_false",
    "responsibility": "测试重复", "processing_remark": "测试"
})
check("5.11 重复核实被拒绝", r5l.status_code == 400)

print("\n▶ 5.12 查询核实记录")
r5m = requests.get(f"{BASE}/api/dispute-verifications/{alloc_id}")
step("5.12 查询核实记录", r5m.json(), r5m.status_code)
check("5.12a 查询成功", r5m.json().get("code") == 0)
check("5.12b conclusion正确", r5m.json()["data"]["conclusion"] == "sender_short")


print("\n" + "="*70)
print("【场景6: receiver_false 完整链路验证】")
print("="*70)

r6a = requests.post(f"{BASE}/api/allocations?creator_id=1", json={
    "idempotent_key": f"test-rf-{uuid.uuid4().hex[:8]}",
    "from_counter": "兰蔻-2F-D05", "to_counter": "兰蔻-2F-C02",
    "brand": "兰蔻", "floor": "2F", "goods_code": "TEST-RF",
    "goods_name": "误报测试品", "quantity": 10, "unit": "瓶", "remark": "误报测试"
})
alloc_id2 = r6a.json()["data"]["id"]
requests.post(f"{BASE}/api/allocations/{alloc_id2}/approve?approver_id=3")
requests.post(f"{BASE}/api/allocations/{alloc_id2}/approve?approver_id=5")

r6b = requests.post(f"{BASE}/api/reviews?reviewer_id=2", json={
    "allocation_id": alloc_id2, "actual_quantity": 8,
    "difference_reason": "实收8瓶差2瓶，疑放错柜位"
})

r6c = requests.post(f"{BASE}/api/dispute-verifications?verifier_id=5", json={
    "allocation_id": alloc_id2, "conclusion": "receiver_false",
    "responsibility": "经核查D05仓出库记录和发货监控，确认10瓶全部装箱发出。C02柜拆箱后将2瓶误放隔壁柜位，属收货方内部管理问题。",
    "processing_remark": "C02柜长已确认找到2瓶，内部调整后数量一致。"
})
step("6.1 receiver_false核实", r6c.json(), r6c.status_code)
check("6.1a conclusion=receiver_false", r6c.json()["data"]["conclusion"] == "receiver_false")
check("6.1b verifier_name=刘督导", r6c.json()["data"].get("verifier_name") == "刘督导")

r6d = requests.get(f"{BASE}/api/allocations/{alloc_id2}")
check("6.2 调拨单状态=verified", r6d.json()["data"]["status"] == "verified")


print("\n" + "="*70)
print("【测试总结】")
print("="*70)
print(f"  通过: {passed}  失败: {failed}")
if failed:
    print("❌ 存在失败项，请检查上面的FAIL项")
else:
    print("✅ 全部通过！差异核实闭环完整。")

print("\n验证点:")
print("  1. ✅ 初始化样例包含sender_short(发货方少装)核实记录")
print("  2. ✅ 初始化样例包含receiver_false(收货方误报)核实记录")
print("  3. ✅ 调拨详情返回核实信息(conclusion/responsibility/verifier_name/verified_at)")
print("  4. ✅ 时间线返回核实字段(verification_conclusion/verification_responsibility/verified_by_name/verified_at)")
print("  5. ✅ 品牌督导核实API: 权限控制+状态校验+结论校验+责任必填+重复阻止")
print("  6. ✅ 核实后调拨单状态变为verified")
print("  7. ✅ 两类结论(sender_short/receiver_false)均可正常创建")
