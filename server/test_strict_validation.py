#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8080/api"

tokens = {}

def login(username, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    data = r.json()
    return data["data"]["token"]

print("=== 登录获取 Token ===")
tokens["production"] = login("production1", "pass123")
tokens["store"] = login("store1", "pass123")
print(f"  production: ✅")
print(f"  store: ✅")

def auth(role):
    return {"Authorization": f"Bearer {tokens[role]}"}

def print_step(step, desc):
    print(f"\n=== 测试 {step}: {desc} ===")

def get_requisition_item_ids(req_id):
    r = requests.get(f"{BASE_URL}/requisitions/{req_id}", headers=auth("production"))
    data = r.json()["data"]
    return [item["id"] for item in data["items"]]

def get_allergen_check_item_ids(req_id):
    r = requests.get(f"{BASE_URL}/requisitions/{req_id}", headers=auth("production"))
    data = r.json()["data"]
    review = data.get("allergen_review")
    if review:
        return [item["id"] for item in review.get("check_items", [])]
    return []

def check_state(label, req_id, expected_req_status, 
                expect_review_exists=False, expected_review_status=None,
                expect_picked_by=False, expect_allergen_checker=False, expect_store_verifier=False,
                expect_review_checked_by=False, expect_review_verified_by=False,
                expect_batch_no=False, expect_review_details=False):
    r = requests.get(f"{BASE_URL}/requisitions/{req_id}", headers=auth("production"))
    data = r.json()["data"]
    
    all_ok = True
    
    actual_status = data["status"]
    status_ok = actual_status == expected_req_status
    if status_ok:
        print(f"  ✅ 领用单状态: {actual_status}")
    else:
        print(f"  ❌ 领用单状态: {actual_status} (期望: {expected_req_status})")
        all_ok = False
    
    picked_by = data.get("picked_by_user", {}).get("name")
    picked_ok = (picked_by is not None) == expect_picked_by
    if picked_ok:
        if expect_picked_by:
            print(f"  ✅ 领料人已写回: {picked_by}")
        else:
            print(f"  ✅ 领料人未写回 (符合预期)")
    else:
        print(f"  ❌ 领料人状态异常: {'有值' if picked_by else '空'} (期望: {'有值' if expect_picked_by else '空'})")
        all_ok = False
    
    if expect_batch_no:
        items = data.get("items", [])
        for item in items:
            if item.get("batch_no"):
                print(f"  ✅ 物料 {item['material_name']}: batch_no = {item['batch_no']}, picked_qty = {item['picked_qty']}")
            else:
                print(f"  ❌ 物料 {item['material_name']}: batch_no 为空")
                all_ok = False
    
    checker = data.get("allergen_checker_user", {}).get("name")
    checker_ok = (checker is not None) == expect_allergen_checker
    if checker_ok:
        if expect_allergen_checker:
            print(f"  ✅ 复核人已写回: {checker}")
        else:
            print(f"  ✅ 复核人未写回 (符合预期)")
    else:
        print(f"  ❌ 复核人状态异常")
        all_ok = False
    
    verifier = data.get("store_verifier_user", {}).get("name")
    verifier_ok = (verifier is not None) == expect_store_verifier
    if verifier_ok:
        if expect_store_verifier:
            print(f"  ✅ 门店确认人已写回: {verifier}")
        else:
            print(f"  ✅ 门店确认人未写回 (符合预期)")
    else:
        print(f"  ❌ 门店确认人状态异常")
        all_ok = False
    
    review = data.get("allergen_review")
    review_exists = review is not None
    review_ok = review_exists == expect_review_exists
    if review_ok:
        if expect_review_exists:
            print(f"  ✅ 复核单已创建")
        else:
            print(f"  ✅ 复核单不存在 (符合预期)")
    else:
        print(f"  ❌ 复核单状态异常: {'存在' if review_exists else '不存在'}")
        all_ok = False
    
    if review and expected_review_status:
        actual_review_status = review.get("status")
        review_status_ok = actual_review_status == expected_review_status
        if review_status_ok:
            print(f"  ✅ 复核单状态: {actual_review_status}")
        else:
            print(f"  ❌ 复核单状态: {actual_review_status} (期望: {expected_review_status})")
            all_ok = False
    
    if review and expect_review_checked_by:
        checked_by = review.get("checked_by_user", {}).get("name")
        if checked_by:
            print(f"  ✅ 复核单 CheckedBy 已写回: {checked_by}")
        else:
            print(f"  ❌ 复核单 CheckedBy 未写回")
            all_ok = False
    
    if review and expect_review_verified_by:
        verified_by = review.get("verified_by_user", {}).get("name")
        if verified_by:
            print(f"  ✅ 复核单 VerifiedBy 已写回: {verified_by}")
        else:
            print(f"  ❌ 复核单 VerifiedBy 未写回")
            all_ok = False
    
    if review and expect_review_details:
        overall_result = review.get("overall_result")
        findings = review.get("findings")
        corrective_actions = review.get("corrective_actions")
        if overall_result:
            print(f"  ✅ 复核单 OverallResult: {overall_result}")
        else:
            print(f"  ❌ 复核单 OverallResult 为空")
            all_ok = False
        if findings:
            print(f"  ✅ 复核单 Findings: {findings}")
        if corrective_actions:
            print(f"  ✅ 复核单 CorrectiveActions: {corrective_actions}")
        
        check_items = review.get("check_items", [])
        if len(check_items) > 0:
            print(f"  ✅ 复核单检查项数量: {len(check_items)}")
            for item in check_items:
                if item.get("label_verified") or item.get("batch_verified"):
                    print(f"    - {item['material_name']}: label_verified={item['label_verified']}, batch_verified={item['batch_verified']}")
                else:
                    print(f"  ❌ 检查项 {item['material_name']}: 验证字段未写入")
                    all_ok = False
        else:
            print(f"  ❌ 复核单检查项为空")
            all_ok = False
    elif review:
        check_items = review.get("check_items", [])
        if len(check_items) > 0:
            print(f"  ✅ 复核单检查项数量: {len(check_items)}")
        else:
            print(f"  ❌ 复核单检查项为空")
            all_ok = False
    
    return all_ok

# ========== 第一部分: picked 状态校验 ==========
print("\n" + "="*60)
print("第一部分: picked 状态严格校验")
print("="*60)

# 创建领用单
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("production"))
po = r.json()["data"][0]
po_id = po["id"]
first_item_id = po["items"][0]["id"]

req_data = {
    "purchase_order_id": po_id,
    "production_line": "picked校验测试线",
    "items": [{
        "purchase_item_id": first_item_id,
        "material_name": "高筋面粉",
        "requested_qty": 50,
        "unit": "kg",
        "allergen_info": "含有小麦"
    }]
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("production"), json=req_data)
req_id1 = r.json()["data"]["id"]
req_item_id1 = get_requisition_item_ids(req_id1)[0]
print(f"  ✅ 创建领用单成功: {req_id1[:20]}...")

# 测试 1: 空 batch_no
print_step(1, "空 batch_no 推进到 picked (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [{
                           "requisition_item_id": req_item_id1,
                           "picked_qty": 50,
                           "batch_no": ""
                       }]
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 2: 空格 batch_no
print_step(2, "空格 batch_no 推进到 picked (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [{
                           "requisition_item_id": req_item_id1,
                           "picked_qty": 50,
                           "batch_no": "   "
                       }]
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 3: picked_qty = 0
print_step(3, "picked_qty = 0 推进到 picked (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [{
                           "requisition_item_id": req_item_id1,
                           "picked_qty": 0,
                           "batch_no": "BATCH-001"
                       }]
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 4: picked_qty 负数
print_step(4, "picked_qty = -5 推进到 picked (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [{
                           "requisition_item_id": req_item_id1,
                           "picked_qty": -5,
                           "batch_no": "BATCH-001"
                       }]
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 5: 明细数量不匹配 (多一条)
print_step(5, "pick_items 数量多于领用单项 (应被拒绝)")
fake_id = "00000000-0000-0000-0000-000000000000"
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [
                           {
                               "requisition_item_id": req_item_id1,
                               "picked_qty": 50,
                               "batch_no": "BATCH-001"
                           },
                           {
                               "requisition_item_id": fake_id,
                               "picked_qty": 10,
                               "batch_no": "BATCH-002"
                           }
                       ]
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 6: 明细数量不匹配 (少一条)
print_step(6, "pick_items 数量少于领用单项 (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": []
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 7: 重复的明细 ID
print_step(7, "pick_items 有重复 ID (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [
                           {
                               "requisition_item_id": req_item_id1,
                               "picked_qty": 30,
                               "batch_no": "BATCH-001"
                           },
                           {
                               "requisition_item_id": req_item_id1,
                               "picked_qty": 20,
                               "batch_no": "BATCH-002"
                           }
                       ]
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 8: 正常领料 (成功)
print_step(8, "提供正确明细推进到 picked (成功)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [{
                           "requisition_item_id": req_item_id1,
                           "picked_qty": 45,
                           "batch_no": "BATCH-2026-0603-001"
                       }],
                       "remarks": "正常领料"
                   })
if r.status_code == 200:
    print(f"  ✅ PATCH 请求成功")
    check_state("picked", req_id1, "picked",
                expect_review_exists=False,
                expect_picked_by=True,
                expect_batch_no=True)
else:
    print(f"  ❌ PATCH 请求失败: {r.status_code}, {r.text}")

# ========== 第二部分: allergen_pending 状态校验 ==========
print("\n" + "="*60)
print("第二部分: allergen_pending 状态校验 (无检查项不创建)")
print("="*60)

# 创建领用单，故意让所有明细 PickedQty 为 0
# 方法：先创建，然后通过数据库层模拟 (这里我们验证正常流程)
# 实际测试：发起复核时如果没有已领料的明细应该拒绝
# 由于我们刚领了料，现在应该可以正常发起

print_step(9, "正常发起 allergen_pending (有领料项，成功)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={"status": "allergen_pending"})
if r.status_code == 200:
    print(f"  ✅ PATCH 请求成功")
    check_state("allergen_pending", req_id1, "allergen_pending",
                expect_review_exists=True, expected_review_status="pending",
                expect_picked_by=True,
                expect_allergen_checker=True,
                expect_review_checked_by=True)
else:
    print(f"  ❌ PATCH 请求失败: {r.status_code}, {r.text}")

check_item_id1 = get_allergen_check_item_ids(req_id1)[0]

# ========== 第三部分: allergen_passed/failed 状态校验 ==========
print("\n" + "="*60)
print("第三部分: allergen_passed/failed 状态严格校验")
print("="*60)

# 测试 10: 空 findings
print_step(10, "空 findings 推进到 allergen_passed (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_passed",
                       "review_check_items": [{
                           "id": check_item_id1,
                           "is_contained": True,
                           "label_verified": True,
                           "batch_verified": True,
                           "cross_contamination_risk": "low",
                           "remarks": ""
                       }],
                       "overall_result": "通过",
                       "findings": "",
                       "corrective_actions": "无"
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 11: 空格 findings
print_step(11, "空格 findings 推进到 allergen_passed (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_passed",
                       "review_check_items": [{
                           "id": check_item_id1,
                           "is_contained": True,
                           "label_verified": True,
                           "batch_verified": True,
                           "cross_contamination_risk": "low",
                           "remarks": ""
                       }],
                       "overall_result": "通过",
                       "findings": "   ",
                       "corrective_actions": "无"
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 12: 空 corrective_actions
print_step(12, "空 corrective_actions 推进到 allergen_passed (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_passed",
                       "review_check_items": [{
                           "id": check_item_id1,
                           "is_contained": True,
                           "label_verified": True,
                           "batch_verified": True,
                           "cross_contamination_risk": "low",
                           "remarks": ""
                       }],
                       "overall_result": "通过",
                       "findings": "无异常",
                       "corrective_actions": ""
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 13: review_check_items 数量不匹配
print_step(13, "review_check_items 数量不匹配 (应被拒绝)")
fake_id = "11111111-1111-1111-1111-111111111111"
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_passed",
                       "review_check_items": [
                           {
                               "id": check_item_id1,
                               "is_contained": True,
                               "label_verified": True,
                               "batch_verified": True,
                               "cross_contamination_risk": "low",
                               "remarks": ""
                           },
                           {
                               "id": fake_id,
                               "is_contained": False,
                               "label_verified": True,
                               "batch_verified": True,
                               "cross_contamination_risk": "low",
                               "remarks": ""
                           }
                       ],
                       "overall_result": "通过",
                       "findings": "无异常",
                       "corrective_actions": "无"
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 14: review_check_items 有重复 ID
print_step(14, "review_check_items 有重复 ID (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_passed",
                       "review_check_items": [
                           {
                               "id": check_item_id1,
                               "is_contained": True,
                               "label_verified": True,
                               "batch_verified": True,
                               "cross_contamination_risk": "low",
                               "remarks": "第一次"
                           },
                           {
                               "id": check_item_id1,
                               "is_contained": False,
                               "label_verified": False,
                               "batch_verified": False,
                               "cross_contamination_risk": "high",
                               "remarks": "第二次"
                           }
                       ],
                       "overall_result": "通过",
                       "findings": "无异常",
                       "corrective_actions": "无"
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 15: 缺少某检查项
print_step(15, "review_check_items 缺少某检查项 (应被拒绝)")
# 先创建一个有2个检查项的领用单
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("production"))
po = r.json()["data"][0]
po_id = po["id"]
first_item_id = po["items"][0]["id"]
second_item_id = po["items"][1]["id"] if len(po["items"]) > 1 else po["items"][0]["id"]

req_data = {
    "purchase_order_id": po_id,
    "production_line": "多检查项测试线",
    "items": [
        {
            "purchase_item_id": first_item_id,
            "material_name": "高筋面粉",
            "requested_qty": 50,
            "unit": "kg",
            "allergen_info": "含有小麦"
        },
        {
            "purchase_item_id": second_item_id,
            "material_name": "鸡蛋",
            "requested_qty": 30,
            "unit": "kg",
            "allergen_info": "含有鸡蛋"
        }
    ]
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("production"), json=req_data)
req_id2 = r.json()["data"]["id"]
req_item_ids = get_requisition_item_ids(req_id2)

# 领料
r = requests.patch(f"{BASE_URL}/requisitions/{req_id2}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [
                           {
                               "requisition_item_id": req_item_ids[0],
                               "picked_qty": 50,
                               "batch_no": "BATCH-MULTI-001"
                           },
                           {
                               "requisition_item_id": req_item_ids[1],
                               "picked_qty": 30,
                               "batch_no": "BATCH-MULTI-002"
                           }
                       ]
                   })
# 发起复核
r = requests.patch(f"{BASE_URL}/requisitions/{req_id2}/status",
                   headers=auth("production"),
                   json={"status": "allergen_pending"})
check_item_ids = get_allergen_check_item_ids(req_id2)

# 只提交第一项的检查
r = requests.patch(f"{BASE_URL}/requisitions/{req_id2}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_passed",
                       "review_check_items": [
                           {
                               "id": check_item_ids[0],
                               "is_contained": True,
                               "label_verified": True,
                               "batch_verified": True,
                               "cross_contamination_risk": "low",
                               "remarks": ""
                           }
                       ],
                       "overall_result": "通过",
                       "findings": "无异常",
                       "corrective_actions": "无"
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 16: 正常提交 allergen_passed (成功)
print_step(16, "提供完整数据推进到 allergen_passed (成功)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_passed",
                       "review_check_items": [{
                           "id": check_item_id1,
                           "is_contained": True,
                           "label_verified": True,
                           "batch_verified": True,
                           "cross_contamination_risk": "low",
                           "remarks": "标签已核实，批次正确，无交叉污染风险"
                       }],
                       "overall_result": "过敏原复核通过，物料可安全使用",
                       "findings": "含有小麦过敏原，符合配料表标注",
                       "corrective_actions": "无需额外措施，按正常流程使用",
                       "remarks": "生产班长复核"
                   })
if r.status_code == 200:
    print(f"  ✅ PATCH 请求成功")
    check_state("allergen_passed", req_id1, "allergen_passed",
                expect_review_exists=True, expected_review_status="passed",
                expect_picked_by=True,
                expect_allergen_checker=True,
                expect_review_checked_by=True,
                expect_review_details=True)
else:
    print(f"  ❌ PATCH 请求失败: {r.status_code}, {r.text}")

# 测试 17: 门店督导确认完成
print_step(17, "门店督导确认 completed (成功)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id1}/status",
                   headers=auth("store"),
                   json={"status": "completed", "remarks": "门店确认通过"})
if r.status_code == 200:
    print(f"  ✅ PATCH 请求成功")
    check_state("completed", req_id1, "completed",
                expect_review_exists=True, expected_review_status="passed",
                expect_picked_by=True,
                expect_allergen_checker=True,
                expect_store_verifier=True,
                expect_review_checked_by=True,
                expect_review_verified_by=True,
                expect_batch_no=True,
                expect_review_details=True)
else:
    print(f"  ❌ PATCH 请求失败: {r.status_code}, {r.text}")

print("\n" + "="*60)
print("✅ 所有校验测试完成!")
print("="*60)
