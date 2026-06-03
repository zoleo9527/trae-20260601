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
tokens["procurement"] = login("procurement1", "pass123")
print(f"  production: ✅")
print(f"  store: ✅")
print(f"  procurement: ✅")

def auth(role):
    return {"Authorization": f"Bearer {tokens[role]}"}

print("\n=== 测试 1: 角色权限限制 (采购主管不能创建领用单) ===")
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("procurement"))
po_id = r.json()["data"][0]["id"]
req_data = {
    "purchase_order_id": po_id,
    "production_line": "测试线",
    "items": []
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("procurement"), json=req_data)
if r.status_code == 403:
    print(f"  ✅ 采购主管不能创建领用单 (403)")
else:
    print(f"  ❌ 采购主管居然能创建领用单! ({r.status_code})")

print("\n=== 测试 2: 生产班长创建领用单 (正常流程) ===")
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("production"))
po = r.json()["data"][0]
po_id = po["id"]
first_item_id = po["items"][0]["id"]

req_data = {
    "purchase_order_id": po_id,
    "production_line": "状态流转测试线",
    "items": [{
        "purchase_item_id": first_item_id,
        "material_name": "测试原料",
        "requested_qty": 10,
        "unit": "kg",
        "allergen_info": "无"
    }]
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("production"), json=req_data)
req_id = r.json()["data"]["id"]
print(f"  ✅ 创建成功，领用单 ID: {req_id[:20]}...")

print("\n=== 测试 3: 非法状态流转 (pending → completed，跳过所有中间状态) ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("production"),
                   json={"status": "completed"})
if r.status_code == 400:
    data = r.json()
    print(f"  ✅ 非法流转被拒绝 (code: {data.get('code')})")
    print(f"     消息: {data.get('message')}")
else:
    print(f"  ❌ 非法流转居然成功了! ({r.status_code})")

print("\n=== 测试 4: 门店督导试图跳过生产班长直接领料 ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("store"),
                   json={"status": "picked"})
if r.status_code == 403:
    data = r.json()
    print(f"  ✅ 门店督导不能领料 (code: {data.get('code')})")
else:
    print(f"  ❌ 门店督导居然能领料! ({r.status_code})")

print("\n=== 测试 5: 正常流程: pending → picked ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("production"),
                   json={"status": "picked", "remarks": "测试领料"})
if r.status_code == 200:
    status = r.json()["data"]["status"]
    print(f"  ✅ 领料成功，状态: {status}")
else:
    print(f"  ❌ 领料失败 ({r.status_code})")

print("\n=== 测试 6: 采购主管试图进行状态变更 ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("procurement"),
                   json={"status": "allergen_pending"})
if r.status_code == 403:
    print(f"  ✅ 采购主管不能变更领用单状态 (403)")
else:
    print(f"  ❌ 采购主管居然能变更! ({r.status_code})")

print("\n=== 测试 7: 正常流程: picked → allergen_pending ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("production"),
                   json={"status": "allergen_pending"})
if r.status_code == 200:
    status = r.json()["data"]["status"]
    print(f"  ✅ 发起复核成功，状态: {status}")
else:
    print(f"  ❌ 发起复核失败 ({r.status_code})")

print("\n=== 测试 8: 门店督导试图提交复核 (生产班长才能提交) ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("store"),
                   json={"status": "allergen_passed"})
if r.status_code == 403:
    print(f"  ✅ 门店督导不能提交复核 (403)")
else:
    print(f"  ❌ 门店督导居然能提交! ({r.status_code})")

print("\n=== 测试 9: 正常流程: allergen_pending → allergen_passed ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("production"),
                   json={"status": "allergen_passed"})
if r.status_code == 200:
    status = r.json()["data"]["status"]
    print(f"  ✅ 复核通过成功，状态: {status}")
else:
    print(f"  ❌ 复核通过失败 ({r.status_code})")

print("\n=== 测试 10: 生产班长试图最终确认 (门店督导才能确认) ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("production"),
                   json={"status": "completed"})
if r.status_code == 403:
    print(f"  ✅ 生产班长不能最终确认 (403)")
else:
    print(f"  ❌ 生产班长居然能最终确认! ({r.status_code})")

print("\n=== 测试 11: 正常流程: allergen_passed → completed ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("store"),
                   json={"status": "completed", "remarks": "最终确认通过"})
if r.status_code == 200:
    status = r.json()["data"]["status"]
    print(f"  ✅ 门店督导确认成功，状态: {status}")
else:
    print(f"  ❌ 门店督导确认失败 ({r.status_code})")

print("\n=== 测试 12: completed 状态不能再变更 ===")
r = requests.patch(f"{BASE_URL}/requisitions/{req_id}/status", 
                   headers=auth("store"),
                   json={"status": "picked"})
if r.status_code == 400:
    data = r.json()
    print(f"  ✅ 已完成状态不能变更 (code: {data.get('code')})")
else:
    print(f"  ❌ 已完成状态居然能变更! ({r.status_code})")

print("\n=== 测试 13: 查看操作日志 (状态变更都有不同的 action_name) ===")
r = requests.get(f"{BASE_URL}/requisitions/{req_id}/logs", headers=auth("production"))
logs = r.json()["data"]
print(f"  ✅ 共 {len(logs)} 条操作记录:")
for log in logs[:6]:
    print(f"     - {log['action_name']} ({log.get('old_status', '')} → {log.get('new_status', '')})")

print("\n=== 测试 14: 门店督导重复确认复核单 (应当拒绝) ===")
# 先创建一个新的完整流程
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("production"))
po = r.json()["data"][0]
po_id = po["id"]
first_item_id = po["items"][0]["id"]

req_data = {
    "purchase_order_id": po_id,
    "production_line": "重复确认测试线",
    "items": [{
        "purchase_item_id": first_item_id,
        "material_name": "测试原料2",
        "requested_qty": 5,
        "unit": "kg",
        "allergen_info": "含有花生"
    }]
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("production"), json=req_data)
req_id2 = r.json()["data"]["id"]

# 走完全流程到门店确认
requests.post(f"{BASE_URL}/requisitions/{req_id2}/pick", headers=auth("production"), json={"items": []})
requests.post(f"{BASE_URL}/requisitions/{req_id2}/initiate-allergen-review", headers=auth("production"))
r = requests.get(f"{BASE_URL}/allergen-reviews/requisition/{req_id2}", headers=auth("production"))
review_id = r.json()["data"]["id"]
requests.post(f"{BASE_URL}/allergen-reviews/{review_id}/submit", headers=auth("production"),
              json={"status": "passed", "overall_result": "ok", "check_items": []})

# 第一次确认
r = requests.post(f"{BASE_URL}/allergen-reviews/{review_id}/verify", headers=auth("store"),
                  json={"status": "passed"})
print(f"  第一次确认: {'✅ 通过' if r.status_code == 200 else '❌ 失败'}")

# 第二次确认（应当拒绝）
r = requests.post(f"{BASE_URL}/allergen-reviews/{review_id}/verify", headers=auth("store"),
                  json={"status": "passed"})
if r.status_code == 400:
    print(f"  ✅ 第二次确认被正确拒绝 (400)")
    print(f"     消息: {r.json().get('message')}")
else:
    print(f"  ❌ 第二次确认居然成功了! ({r.status_code})")

print("\n=== 测试 15: 门店督导确认时 status 不匹配 (review 是 passed，却提交 failed) ===")
# 创建新的
r = requests.get(f"{BASE_URL}/purchase-orders", headers=auth("production"))
po = r.json()["data"][0]
po_id = po["id"]
first_item_id = po["items"][0]["id"]

req_data = {
    "purchase_order_id": po_id,
    "production_line": "状态不匹配测试线",
    "items": [{
        "purchase_item_id": first_item_id,
        "material_name": "测试原料3",
        "requested_qty": 5,
        "unit": "kg",
        "allergen_info": "无"
    }]
}
r = requests.post(f"{BASE_URL}/requisitions", headers=auth("production"), json=req_data)
req_id3 = r.json()["data"]["id"]

requests.post(f"{BASE_URL}/requisitions/{req_id3}/pick", headers=auth("production"), json={"items": []})
requests.post(f"{BASE_URL}/requisitions/{req_id3}/initiate-allergen-review", headers=auth("production"))
r = requests.get(f"{BASE_URL}/allergen-reviews/requisition/{req_id3}", headers=auth("production"))
review_id3 = r.json()["data"]["id"]
requests.post(f"{BASE_URL}/allergen-reviews/{review_id3}/submit", headers=auth("production"),
              json={"status": "passed", "overall_result": "ok", "check_items": []})

# 提交不匹配的 status
r = requests.post(f"{BASE_URL}/allergen-reviews/{review_id3}/verify", headers=auth("store"),
                  json={"status": "failed"})
if r.status_code == 400:
    print(f"  ✅ 状态不匹配被正确拒绝 (400)")
    print(f"     消息: {r.json().get('message')}")
else:
    print(f"  ❌ 状态不匹配居然成功了! ({r.status_code})")

print("\n" + "="*50)
print("✅ 所有测试完成!")
print("="*50)
