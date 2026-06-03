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

# ========== 测试: 缺少必要参数会被拒绝 ==========
print("\n" + "="*60)
print("测试 1: 缺少必要参数会被拒绝")
print("="*60)

# 创建领用单
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("production"))
po = r.json()["data"][0]
po_id = po["id"]
first_item_id = po["items"][0]["id"]

req_data = {
    "purchase_order_id": po_id,
    "production_line": "参数校验测试线",
    "items": [{
        "purchase_item_id": first_item_id,
        "material_name": "高筋面粉",
        "requested_qty": 50,
        "unit": "kg",
        "allergen_info": "含有小麦"
    }]
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("production"), json=req_data)
req_id_test1 = r.json()["data"]["id"]
req_item_id_test1 = get_requisition_item_ids(req_id_test1)[0]
print(f"  ✅ 创建领用单成功: {req_id_test1[:20]}...")

# 测试 1: 不提供 pick_items 推进到 picked
print_step(1, "不提供 pick_items 推进到 picked (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test1}/status",
                   headers=auth("production"),
                   json={"status": "picked", "remarks": "无明细领料"})
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 2: 正常领料（提供明细）
print_step(2, "提供 pick_items 推进到 picked (成功)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test1}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [{
                           "requisition_item_id": req_item_id_test1,
                           "picked_qty": 45,
                           "batch_no": "BATCH-2026-0603-001"
                       }],
                       "remarks": "正常领料"
                   })
if r.status_code == 200:
    print(f"  ✅ PATCH 请求成功")
    check_state("picked", req_id_test1, "picked",
                expect_review_exists=False,
                expect_picked_by=True,
                expect_batch_no=True)
else:
    print(f"  ❌ PATCH 请求失败: {r.status_code}, {r.text}")

# 测试 3: 发起复核
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test1}/status",
                   headers=auth("production"),
                   json={"status": "allergen_pending"})
check_item_id = get_allergen_check_item_ids(req_id_test1)[0]

# 测试 4: 不提供 review_check_items 推进到 allergen_passed
print_step(3, "不提供 review_check_items 推进到 allergen_passed (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test1}/status",
                   headers=auth("production"),
                   json={"status": "allergen_passed", "remarks": "无检查项提交"})
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 5: 不提供 overall_result 推进到 allergen_passed
print_step(4, "不提供 overall_result 推进到 allergen_passed (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test1}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_passed",
                       "review_check_items": [{
                           "id": check_item_id,
                           "is_contained": True,
                           "label_verified": True,
                           "batch_verified": True,
                           "cross_contamination_risk": "low",
                           "remarks": "已核实"
                       }]
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# 测试 6: 正常提交复核（提供完整数据）
print_step(5, "提供完整数据推进到 allergen_passed (成功)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test1}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_passed",
                       "review_check_items": [{
                           "id": check_item_id,
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
    check_state("allergen_passed", req_id_test1, "allergen_passed",
                expect_review_exists=True, expected_review_status="passed",
                expect_picked_by=True,
                expect_allergen_checker=True,
                expect_review_checked_by=True,
                expect_review_details=True)
else:
    print(f"  ❌ PATCH 请求失败: {r.status_code}, {r.text}")

# ========== 测试: failed 分支完整流程 ==========
print("\n" + "="*60)
print("测试 2: failed 分支完整流程 (含完整数据)")
print("="*60)

# 创建领用单
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("production"))
po = r.json()["data"][0]
po_id = po["id"]
first_item_id = po["items"][0]["id"]

req_data = {
    "purchase_order_id": po_id,
    "production_line": "failed分支测试线",
    "items": [{
        "purchase_item_id": first_item_id,
        "material_name": "花生酱",
        "requested_qty": 10,
        "unit": "kg",
        "allergen_info": "含有花生"
    }]
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("production"), json=req_data)
req_id_test2 = r.json()["data"]["id"]
req_item_id_test2 = get_requisition_item_ids(req_id_test2)[0]
print(f"  ✅ 创建领用单成功: {req_id_test2[:20]}...")

# Step 1: 领料
print_step(6, "failed分支 - 领料")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test2}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [{
                           "requisition_item_id": req_item_id_test2,
                           "picked_qty": 10,
                           "batch_no": "PEANUT-2026-001"
                       }]
                   })
print(f"  Step 1: pending → picked: {'✅' if r.status_code == 200 else '❌'}")

# Step 2: 发起复核
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test2}/status",
                   headers=auth("production"),
                   json={"status": "allergen_pending"})
check_item_id_test2 = get_allergen_check_item_ids(req_id_test2)[0]
print(f"  Step 2: picked → allergen_pending: {'✅' if r.status_code == 200 else '❌'}")

# Step 3: 提交 failed 结果
print_step(7, "failed分支 - 提交复核结果 (failed)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test2}/status",
                   headers=auth("production"),
                   json={
                       "status": "allergen_failed",
                       "review_check_items": [{
                           "id": check_item_id_test2,
                           "is_contained": True,
                           "label_verified": False,
                           "batch_verified": True,
                           "cross_contamination_risk": "high",
                           "remarks": "标签未标注含有花生过敏原"
                       }],
                       "overall_result": "复核不通过，存在未标注过敏原风险",
                       "findings": "检测到花生过敏原，但产品标签未标注",
                       "corrective_actions": "1. 该批次物料全部退货\n2. 通知供应商整改\n3. 加强来料检验"
                   })
print(f"  Step 3: allergen_pending → allergen_failed: {'✅' if r.status_code == 200 else '❌'}")

# Step 4: 门店督导确认
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test2}/status",
                   headers=auth("store"),
                   json={"status": "completed", "remarks": "确认不合格，安排退货"})
print(f"  Step 4: allergen_failed → completed: {'✅' if r.status_code == 200 else '❌'}")

# 验证最终状态
print_step(8, "验证 failed 分支完整数据")
check_state("completed-failed", req_id_test2, "completed",
            expect_review_exists=True, expected_review_status="failed",
            expect_picked_by=True,
            expect_allergen_checker=True,
            expect_store_verifier=True,
            expect_review_checked_by=True,
            expect_review_verified_by=True,
            expect_batch_no=True,
            expect_review_details=True)

# ========== 测试: 超领校验 ==========
print("\n" + "="*60)
print("测试 3: 领料数量超过申请量 (应被拒绝)")
print("="*60)

# 创建领用单
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("production"))
po = r.json()["data"][0]
po_id = po["id"]
first_item_id = po["items"][0]["id"]

req_data = {
    "purchase_order_id": po_id,
    "production_line": "超领测试线",
    "items": [{
        "purchase_item_id": first_item_id,
        "material_name": "测试原料",
        "requested_qty": 10,
        "unit": "kg",
        "allergen_info": "无"
    }]
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("production"), json=req_data)
req_id_test3 = r.json()["data"]["id"]
req_item_id_test3 = get_requisition_item_ids(req_id_test3)[0]
print(f"  ✅ 创建领用单成功: {req_id_test3[:20]}...")

print_step(9, "领料数量 15 > 申请量 10 (应被拒绝)")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id_test3}/status",
                   headers=auth("production"),
                   json={
                       "status": "picked",
                       "pick_items": [{
                           "requisition_item_id": req_item_id_test3,
                           "picked_qty": 15,
                           "batch_no": "OVER-001"
                       }]
                   })
if r.status_code == 400:
    print(f"  ✅ 正确拒绝: {r.json()['message']}")
else:
    print(f"  ❌ 未拒绝: {r.status_code}, {r.text}")

# ========== 测试: 专用接口仍能正常工作 ==========
print("\n" + "="*60)
print("测试 4: 专用接口仍能正常工作 (向后兼容)")
print("="*60)

# 创建领用单
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("production"))
po = r.json()["data"][0]
po_id = po["id"]
first_item_id = po["items"][0]["id"]

req_data = {
    "purchase_order_id": po_id,
    "production_line": "专用接口测试线",
    "items": [{
        "purchase_item_id": first_item_id,
        "material_name": "专用接口原料",
        "requested_qty": 20,
        "unit": "kg",
        "allergen_info": "含有大豆"
    }]
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("production"), json=req_data)
req_id_test4 = r.json()["data"]["id"]
req_item_id_test4 = get_requisition_item_ids(req_id_test4)[0]
print(f"  ✅ 创建领用单成功: {req_id_test4[:20]}...")

# 专用领料接口
print_step(10, "使用专用领料接口 /requisitions/:id/pick")
r = requests.post(f"{BASE_URL}/requisitions/{req_id_test4}/pick",
                  headers=auth("production"),
                  json={
                      "items": [{
                          "requisition_item_id": req_item_id_test4,
                          "picked_qty": 18,
                          "batch_no": "DEDICATED-001"
                      }]
                  })
if r.status_code == 200:
    print(f"  ✅ 专用领料接口成功")
    check_state("dedicated-pick", req_id_test4, "picked",
                expect_review_exists=False,
                expect_picked_by=True,
                expect_batch_no=True)
else:
    print(f"  ❌ 专用领料接口失败: {r.status_code}, {r.text}")

# 专用发起复核接口
print_step(11, "使用专用发起复核接口 /requisitions/:id/initiate-allergen-review")
r = requests.post(f"{BASE_URL}/requisitions/{req_id_test4}/initiate-allergen-review",
                  headers=auth("production"))
if r.status_code == 200:
    print(f"  ✅ 专用发起复核接口成功")
else:
    print(f"  ❌ 专用发起复核接口失败: {r.status_code}, {r.text}")

# 专用提交复核接口
check_item_id_test4 = get_allergen_check_item_ids(req_id_test4)[0]
print_step(12, "使用专用提交复核接口 /allergen-reviews/:id/submit")
review_id = r.json()["data"]["review"]["id"]
r = requests.post(f"{BASE_URL}/allergen-reviews/{review_id}/submit",
                  headers=auth("production"),
                  json={
                      "status": "passed",
                      "overall_result": "专用接口复核通过",
                      "findings": "过敏原标注正确",
                      "corrective_actions": "无",
                      "check_items": [{
                          "id": check_item_id_test4,
                          "is_contained": True,
                          "label_verified": True,
                          "batch_verified": True,
                          "cross_contamination_risk": "low",
                          "remarks": "ok"
                      }]
                  })
if r.status_code == 200:
    print(f"  ✅ 专用提交复核接口成功")
else:
    print(f"  ❌ 专用提交复核接口失败: {r.status_code}, {r.text}")

print("\n" + "="*60)
print("✅ 所有测试完成!")
print("="*60)
