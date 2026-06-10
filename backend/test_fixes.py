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

# ===== 准备数据 =====
print("\n=== 准备基础数据 ===")
r = requests.post(f"{BASE}/regions/", json={"code": "T-R001", "name": "测试区A", "target_capacity": 100})
region_a_id = r.json()["id"]
test("创建区域A", r)

r = requests.post(f"{BASE}/regions/", json={"code": "T-R002", "name": "测试区B", "target_capacity": 50})
region_b_id = r.json()["id"]
test("创建区域B", r)

for i in range(1, 6):
    r = requests.post(f"{BASE}/vehicles/", json={"bike_code": f"TEST-{i:03d}", "model": "Test", "current_region_id": region_a_id})
    test(f"创建车辆 TEST-{i:03d}", r)

# 先上报几个故障
for i in range(1, 4):
    r = requests.post(f"{BASE}/faults/", json={
        "vehicle_id": i, "fault_type": f"故障类型{i}", "description": "测试故障",
        "reporter": "test", "region_id": region_a_id
    })
    test(f"上报故障{i}", r)

# ===== 修复1：坏车入库必须有故障信息，必生成维修单 =====
print("\n=== 修复验证1：坏车入库故障信息校验 & 必生成维修单 ===")

# 测试：入库不带故障信息，应失败
r = requests.post(f"{BASE}/inbound/batches/", json={
    "source_region_id": region_a_id,
    "repair_station": "测试维修点",
    "items": [{"vehicle_id": 4}]
})
test("入库无故障信息 → 应400失败", r, expected_status=400)

# 测试：入库用 fault_id 但故障不属于该车，应失败
r = requests.post(f"{BASE}/inbound/batches/", json={
    "source_region_id": region_a_id,
    "repair_station": "测试维修点",
    "items": [{"vehicle_id": 4, "fault_id": 1}]
})
test("入库用其他车辆的故障ID → 应400失败", r, expected_status=400)

# 测试：正常入库（带 fault_type），应生成维修单
r = requests.post(f"{BASE}/inbound/batches/", json={
    "source_region_id": region_a_id,
    "repair_station": "测试维修点",
    "operator": "测试员",
    "items": [
        {"vehicle_id": 1, "fault_id": 1},
        {"vehicle_id": 2, "fault_id": 2},
        {"vehicle_id": 4, "fault_type": "脚踏损坏", "fault_description": "测试"}
    ]
})

def check_inbound(data):
    if len(data["items"]) != 3:
        return False, f"应有3条入库明细，实际{len(data['items'])}"
    for item in data["items"]:
        if "repair_order" not in item or item["repair_order"] is None:
            return False, f"车辆{item['vehicle_id']}的入库明细没有关联维修单"
    return True, ""

test("正常入库3辆 → 应成功且每车都有维修单", r, expected_status=200, check_fn=check_inbound)
batch_id = r.json()["id"]

# 验证车辆都在维修中
r = requests.get(f"{BASE}/vehicles/", params={"status": "IN_REPAIR"})
test("入库后车辆状态为IN_REPAIR", r, expected_status=200,
     check_fn=lambda d: (True, "") if len(d) >= 3 else (False, f"至少3辆在维修中，实际{len(d)}"))

# 验证维修点有3个待修工单
r = requests.get(f"{BASE}/repair/stations/summary")
def check_pending(data):
    for s in data:
        if s["pending_count"] == 3:
            return True, ""
    return False, f"应找到待修数为3的维修点，实际: {data}"
test("维修点待修数量为3", r, expected_status=200, check_fn=check_pending)

# ===== 修复2：维修单链路关联字段稳定 =====
print("\n=== 修复验证2：维修单链路关联稳定 ===")

# 通过车辆ID查询最新维修单
r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": 1, "latest_only": "true"})
def check_latest(data):
    if len(data) != 1:
        return False, f"应只返回1条，实际{len(data)}"
    if data[0]["vehicle_id"] != 1:
        return False, "归属车辆不正确"
    if data[0]["status"] != "PENDING":
        return False, f"状态应为PENDING，实际{data[0]['status']}"
    return True, ""
test("按车辆查最新维修单（latest_only）", r, expected_status=200, check_fn=check_latest)
order_1_id = r.json()[0]["id"]

# 维修退回
r = requests.post(f"{BASE}/repair/orders/{order_1_id}/reject",
                  json={"reject_reason": "测试配件缺货", "mechanic": "测试技师"})
def check_reject(data):
    if data["status"] != "REJECTED":
        return False, f"状态应为REJECTED，实际{data['status']}"
    if data["parts_available"] is not False:
        return False, "parts_available应为False"
    return True, ""
test("维修退回（配件缺货）", r, expected_status=200, check_fn=check_reject)

# 验证退回后，车辆状态仍为 IN_REPAIR
r = requests.get(f"{BASE}/vehicles/", params={"status": "IN_REPAIR"})
def check_still_in_repair(data):
    found = any(v["id"] == 1 for v in data)
    return (True, "") if found else (False, "1号车应仍在维修中")
test("退回后车辆仍为IN_REPAIR状态", r, expected_status=200, check_fn=check_still_in_repair)

# 完成另外两辆车的维修
r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": 2, "latest_only": "true"})
order_2_id = r.json()[0]["id"]
r = requests.get(f"{BASE}/repair/orders/", params={"vehicle_id": 4, "latest_only": "true"})
order_4_id = r.json()[0]["id"]

r = requests.post(f"{BASE}/repair/orders/{order_2_id}/complete",
                  json={"repair_note": "测试完成", "mechanic": "赵技师"})
test("完成2号车维修", r, expected_status=200,
     check_fn=lambda d: (True, "") if d["status"] == "COMPLETED" else (False, f"状态: {d['status']}"))

r = requests.post(f"{BASE}/repair/orders/{order_4_id}/complete",
                  json={"repair_note": "测试完成", "mechanic": "赵技师"})
test("完成4号车维修", r, expected_status=200,
     check_fn=lambda d: (True, "") if d["status"] == "COMPLETED" else (False, f"状态: {d['status']}"))

# ===== 修复3：批量出库校验维修单与车辆归属 =====
print("\n=== 修复验证3：批量出库校验维修单车辆归属 ===")

# 测试：用A车的维修单投放B车，应失败
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_b_id,
    "operator": "测试调度",
    "items": [
        {"vehicle_id": 4, "repair_order_id": order_2_id}  # 2号车的工单投4号车
    ]
})
def check_wrong_order(data):
    detail = data.get("detail", "")
    if "不一致" in detail or "归属" in detail:
        return True, ""
    return False, f"错误信息应包含归属/不一致，实际: {detail}"
test("用错车维修单投放 → 应400失败", r, expected_status=400, check_fn=check_wrong_order)

# 测试：用退回的维修单投放，应失败
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_b_id,
    "items": [
        {"vehicle_id": 1, "repair_order_id": order_1_id}
    ]
})
test("用退回维修单投放 → 应400失败", r, expected_status=400)

# 正常批量投放
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region_b_id,
    "operator": "测试调度",
    "items": [
        {"vehicle_id": 2, "repair_order_id": order_2_id},
        {"vehicle_id": 4, "repair_order_id": order_4_id}
    ]
})
def check_deployment(data):
    if len(data) != 2:
        return False, f"应返回2条投放记录，实际{len(data)}"
    if not all(d["status"] == "PENDING_REVIEW" for d in data):
        return False, "状态应为待复核"
    if not all(d.get("repair_order") is not None for d in data):
        return False, "每条都应有关联维修单"
    return True, ""
test("正常批量投放2辆车", r, expected_status=200, check_fn=check_deployment)
dep_2_id = r.json()[0]["id"]
dep_4_id = r.json()[1]["id"]

# 投放后复核
r = requests.post(f"{BASE}/deployments/{dep_2_id}/review", json={
    "status": "CONFIRMED", "review_note": "正常", "reviewer": "测试经理"
})
def check_confirm(data):
    if data["status"] != "CONFIRMED":
        return False, f"状态应为CONFIRMED，实际{data['status']}"
    if data["vehicle"]["status"] != "IN_SERVICE":
        return False, f"车辆应回到运营状态，实际{data['vehicle']['status']}"
    return True, ""
test("投放复核 - 确认正常", r, expected_status=200, check_fn=check_confirm)

r = requests.post(f"{BASE}/deployments/{dep_4_id}/review", json={
    "status": "ISSUE_FOUND", "review_note": "有问题", "reviewer": "测试经理"
})
def check_issue(data):
    if data["status"] != "ISSUE_FOUND":
        return False, f"状态应为ISSUE_FOUND，实际{data['status']}"
    if data["vehicle"]["status"] != "BROKEN":
        return False, f"车辆应变回故障状态，实际{data['vehicle']['status']}"
    return True, ""
test("投放复核 - 发现问题", r, expected_status=200, check_fn=check_issue)

# ===== 验证区域缺口统计 =====
print("\n=== 辅助验证：区域缺口统计 ===")
r = requests.get(f"{BASE}/regions/summary")
test("区域缺口统计", r, expected_status=200,
     check_fn=lambda d: (True, "") if len(d) >= 2 else (False, f"至少2个区域"))

# ===== 验证入库明细返回维修单信息 =====
print("\n=== 辅助验证：入库查询带维修单信息 ===")
r = requests.get(f"{BASE}/inbound/batches/")
def check_inbound_query(data):
    if len(data) < 1:
        return False, "没有入库批次"
    if not data[0].get("items"):
        return False, "没有入库明细"
    if not data[0]["items"][0].get("repair_order"):
        return False, "明细不带维修单信息"
    return True, ""
test("入库批次查询带维修单关联", r, expected_status=200, check_fn=check_inbound_query)

# ===== 总结 =====
print("\n" + "="*60)
print(f"测试完成: {passed} 通过, {failed} 失败")
if failed == 0:
    print("🎉 所有测试通过!")
else:
    print("❌ 有测试失败，请检查!")
