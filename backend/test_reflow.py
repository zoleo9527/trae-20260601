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
    status = "✓ PASS" if ok else "✗ FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"[{status}] {label} (HTTP {r.status_code})")
    if not ok:
        if fail_reason:
            print(f"    原因: {fail_reason}")
        else:
            print(f"    期望: {expected_status}, 实际: {r.status_code}")
        print(f"    响应: {json.dumps(r.json(), ensure_ascii=False)}")
    return ok

# ===== 准备基础数据 =====
print("\n=== 准备基础数据 ===")
r = requests.post(f"{BASE}/regions/", json={"code": "V3-A", "name": "区域A", "manager": "张经理", "target_capacity": 100})
region_a = r.json()["id"]
test("创建区域A", r)

r = requests.post(f"{BASE}/regions/", json={"code": "V3-B", "name": "区域B", "manager": "李经理", "target_capacity": 50})
region_b = r.json()["id"]
test("创建区域B", r)

r = requests.post(f"{BASE}/regions/", json={"code": "V3-C", "name": "区域C", "manager": "王经理", "target_capacity": 30})
region_c = r.json()["id"]
test("创建区域C", r)

vehicle_ids = []
for i in range(1, 5):
    r = requests.post(f"{BASE}/vehicles/", json={"bike_code": f"V3-{i:03d}", "model": "Test", "current_region_id": region_a})
    vid = r.json()["id"]
    vehicle_ids.append(vid)
    test(f"创建车辆 V3-{i:03d} (id={vid})", r)

# 上报故障
fault_ids = []
for i in range(1, 5):
    r = requests.post(f"{BASE}/faults/", json={
        "vehicle_id": vehicle_ids[i-1], "fault_type": f"故障{i}",
        "description": "测试", "reporter": "test", "region_id": region_a
    })
    fault_ids.append(r.json()["id"])
    test(f"上报故障{i}", r)

# 坏车入库
r = requests.post(f"{BASE}/inbound/batches/", json={
    "source_region_id": region_a,
    "repair_station": "V3测试维修点",
    "operator": "测试",
    "items": [
        {"vehicle_id": vehicle_ids[0], "fault_id": fault_ids[0]},
        {"vehicle_id": vehicle_ids[1], "fault_id": fault_ids[1]},
        {"vehicle_id": vehicle_ids[2], "fault_id": fault_ids[2]},
        {"vehicle_id": vehicle_ids[3], "fault_id": fault_ids[3]}
    ]
})
test("批量入库4辆", r, expected_status=200,
     check_fn=lambda d: (True, "") if len(d["items"]) == 4 else (False, f"入库数{len(d['items'])}"))

# 完成全部维修
order_ids = []
for vid in vehicle_ids:
    r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": vid, "latest_only": "true"})
    oid = r.json()[0]["id"]
    order_ids.append(oid)
    r = requests.post(f"{BASE}/repair/orders/{oid}/complete", json={"repair_note": "修好了", "mechanic": "技师"})
    test(f"完成车辆{vid}维修", r)

# 投放车辆1和2到区域B
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_b,
    "operator": "调度",
    "items": [
        {"vehicle_id": vehicle_ids[0], "repair_order_id": order_ids[0]},
        {"vehicle_id": vehicle_ids[1], "repair_order_id": order_ids[1]}
    ]
})
def check_dep(data):
    if len(data) != 2:
        return False, f"应2条投放，实际{len(data)}"
    return True, ""
test("投放车辆1、2到区域B", r, expected_status=200, check_fn=check_dep)
dep_v1_id = r.json()[0]["id"]
dep_v2_id = r.json()[1]["id"]

# 投放车辆3到区域C
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_c,
    "operator": "调度",
    "items": [{"vehicle_id": vehicle_ids[2], "repair_order_id": order_ids[2]}]
})
dep_v3_id = r.json()[0]["id"]
test("投放车辆3到区域C", r)

# ===== 修复验证1：区域反馈只能提交给目标区域的投放记录 =====
print("\n=== 修复验证1：区域反馈区域归属校验 ===")

# 尝试用区域A（不是目标区域）给投放到区域B的记录提反馈，应失败
r = requests.post(f"{BASE}/feedback/", json={
    "region_id": region_a,
    "deployment_id": dep_v1_id,
    "feedback_type": "CONFIRM",
    "description": "区域不匹配测试",
    "reporter": "张经理"
})
test("用非目标区域提交反馈 → 应400失败", r, expected_status=400,
     check_fn=lambda d: (True, "") if "不一致" in d.get("detail", "") else (False, f"detail: {d.get('detail', '')}"))

# 用目标区域B提交确认反馈，应成功
r = requests.post(f"{BASE}/feedback/", json={
    "region_id": region_b,
    "deployment_id": dep_v1_id,
    "feedback_type": "CONFIRM",
    "description": "车辆1运营正常",
    "reporter": "李经理"
})
test("用目标区域B提交确认反馈 → 应成功", r, expected_status=200)

# ===== 修复验证2：异常回流（复核/反馈触发车辆回流入待修 + 维修单重置） =====
print("\n=== 修复验证2：异常回流链路 ===")

# 2a. 复核异常触发回流
r = requests.post(f"{BASE}/deployments/{dep_v2_id}/review", json={
    "status": "ISSUE_FOUND",
    "review_note": "投放复核发现车胎仍有问题",
    "reviewer": "李经理"
})
def check_review_issue(data):
    v = data.get("vehicle", {})
    if v.get("status") != "IN_REPAIR":
        return False, f"车辆应回流到IN_REPAIR，实际{v.get('status')}"
    return True, ""
test("复核异常 → 车辆回流到IN_REPAIR", r, expected_status=200, check_fn=check_review_issue)

# 验证关联维修单回到PENDING
r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": vehicle_ids[1], "latest_only": "true"})
def check_order_pending(data):
    o = data[0]
    if o["status"] != "PENDING":
        return False, f"维修单应为PENDING，实际{o['status']}"
    if o["parts_available"] is not True:
        return False, f"parts_available应重置为True，实际{o['parts_available']}"
    if o["complete_time"] is not None:
        return False, "complete_time应为None"
    if o["repair_note"] is not None:
        return False, "repair_note应为None"
    return True, ""
test("复核异常 → 维修单回到PENDING(返修)", r, expected_status=200, check_fn=check_order_pending)
return_order_id = r.json()[0]["id"]

# 2b. 异常反馈触发回流
r = requests.post(f"{BASE}/feedback/", json={
    "region_id": region_c,
    "deployment_id": dep_v3_id,
    "feedback_type": "ISSUE",
    "description": "车辆3运营中发现脚踏松动",
    "reporter": "王经理"
})
def check_feedback_issue(data):
    # 验证车辆状态
    r2 = requests.get(f"{BASE}/vehicles/", params={"status": "IN_REPAIR"})
    v3_in_repair = any(v["id"] == vehicle_ids[2] for v in r2.json())
    if not v3_in_repair:
        return False, "车辆3应回流到IN_REPAIR"
    return True, ""
test("区域异常反馈 → 车辆回流到IN_REPAIR", r, expected_status=200, check_fn=check_feedback_issue)

# 验证车辆3的维修单也回到PENDING
r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": vehicle_ids[2], "latest_only": "true"})
def check_v3_order_pending(data):
    o = data[0]
    if o["status"] != "PENDING":
        return False, f"车辆3维修单应为PENDING，实际{o['status']}"
    return True, ""
test("区域异常反馈 → 维修单回到PENDING(返修)", r, expected_status=200, check_fn=check_v3_order_pending)
return_order_v3_id = r.json()[0]["id"]

# ===== 修复验证3：批量出库排除挂着异常反馈的车辆 =====
print("\n=== 修复验证3：批量出库排除异常车辆 ===")

# 3a. 尝试用旧已修工单投放（车辆2被复核退回，维修单已回PENDING）
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_b,
    "operator": "调度",
    "items": [{"vehicle_id": vehicle_ids[1], "repair_order_id": return_order_id}]
})
test("用回PENDING的工单投放车辆2 → 应400失败", r, expected_status=400)

# 3b. 尝试投放车辆3（有异常反馈、工单也回PENDING）
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_c,
    "operator": "调度",
    "items": [{"vehicle_id": vehicle_ids[2], "repair_order_id": return_order_v3_id}]
})
test("投放有异常反馈的车辆3 → 应400失败", r, expected_status=400,
     check_fn=lambda d: (True, "") if "异常反馈" in d.get("detail", "") else (False, f"detail: {d.get('detail', '')}"))

# 3c. 返修完成车辆2后，可以正常重新投放
r = requests.post(f"{BASE}/repair/orders/{return_order_id}/complete", json={
    "repair_note": "返修完成，更换新内胎", "mechanic": "赵技师"
})
test("完成车辆2返修", r, expected_status=200,
     check_fn=lambda d: (True, "") if d["status"] == "COMPLETED" else (False, f"状态: {d['status']}"))

# 确认异常反馈仍存在时，车辆2仍不能投放（因为它没有异常反馈，只是复核有问题，所以可以投放）
# 车辆2的情况：复核异常 → 车辆回IN_REPAIR + 工单回PENDING → 现在工单COMPLETED
# 车辆2没有异常反馈（只有复核异常），所以现在应该可以重新投放
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_b,
    "operator": "调度",
    "items": [{"vehicle_id": vehicle_ids[1], "repair_order_id": return_order_id}]
})
test("车辆2返修完成后重新投放 → 应成功", r, expected_status=200)

# 3d. 车辆3虽然也能返修完成，但它有未解决的异常反馈记录
r = requests.post(f"{BASE}/repair/orders/{return_order_v3_id}/complete", json={
    "repair_note": "返修完成", "mechanic": "赵技师"
})
test("完成车辆3返修", r, expected_status=200)

r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_c,
    "operator": "调度",
    "items": [{"vehicle_id": vehicle_ids[2], "repair_order_id": return_order_v3_id}]
})
test("车辆3虽有新完工单但有异常反馈 → 应400失败", r, expected_status=400,
     check_fn=lambda d: (True, "") if "异常反馈" in d.get("detail", "") else (False, f"detail: {d.get('detail', '')}"))

# ===== 辅助验证：正常链路仍可用 =====
print("\n=== 辅助验证：正常链路仍可用 ===")

# 车辆4没有投放过，直接投放
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_a,
    "operator": "调度",
    "items": [{"vehicle_id": vehicle_ids[3], "repair_order_id": order_ids[3]}]
})
test("车辆4正常投放 → 应成功", r, expected_status=200)

# 投放后确认正常
dep_v4_id = r.json()[0]["id"]
r = requests.post(f"{BASE}/deployments/{dep_v4_id}/review", json={
    "status": "CONFIRMED", "review_note": "正常", "reviewer": "张经理"
})
test("车辆4复核确认 → 应成功", r, expected_status=200,
     check_fn=lambda d: (True, "") if d["vehicle"]["status"] == "IN_SERVICE" else (False, f"状态: {d['vehicle']['status']}"))

# 区域缺口统计
r = requests.get(f"{BASE}/regions/summary")
test("区域缺口统计正常", r, expected_status=200)

# ===== 总结 =====
print("\n" + "="*60)
print(f"测试完成: {passed} 通过, {failed} 失败")
if failed == 0:
    print("🎉 所有测试通过!")
else:
    print("❌ 有测试失败，请检查!")
