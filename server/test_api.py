import sys
import json
import urllib.request
import urllib.parse

BASE_URL = "http://localhost:8080/api"

def request(method, path, token=None, data=None):
    url = BASE_URL + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 500, {"error": str(e)}

def login(username, password):
    status, resp = request("POST", "/auth/login", data={"username": username, "password": password})
    if status == 200 and resp["code"] == 0:
        return resp["data"]["token"], resp["data"]["user"]
    return None, resp

print("=== Step 1: Login ===")
token_prod, user_prod = login("production1", "pass123")
print(f"  production1: {user_prod['name']} ({user_prod['role']})")

token_store, user_store = login("store1", "pass123")
print(f"  store1: {user_store['name']} ({user_store['role']})")

token_proc, user_proc = login("procurement1", "pass123")
print(f"  procurement1: {user_proc['name']} ({user_proc['role']})")

print("\n=== Step 2: Get purchase orders ===")
status, resp = request("GET", "/purchase-orders", token=token_prod)
po_id = None
po_item_id = None
for po in resp["data"]:
    print(f"  {po['order_no']} - {po['status']} - {po['id']}")
    if po["status"] == "received":
        po_id = po["id"]
        if po.get("items") and len(po["items"]) > 0:
            po_item_id = po["items"][0]["id"]

print(f"  Using PO: {po_id}, first item: {po_item_id}")

print("\n=== Step 3: Create requisition (生产班长) ===")
status, resp = request("POST", "/requisitions", token=token_prod, data={
    "purchase_order_id": po_id,
    "production_line": "A线-面包生产区",
    "items": [
        {"purchase_item_id": po_item_id, "material_name": "小麦粉", "requested_qty": 100, "unit": "kg", "allergen_info": "含麸质"},
    ],
    "remarks": "6月3日早餐面包生产批次"
})
print(f"  Status: {status}, Code: {resp['code']}, Msg: {resp['message']}")
if resp["code"] == 0:
    req_id = resp["data"]["id"]
    req_no = resp["data"]["requisition_no"]
    print(f"  Requisition: {req_no} - {resp['data']['status']}")
    print(f"  Items: {len(resp['data']['items'])} items")
    
    item_id = resp["data"]["items"][0]["id"]
    
    print("\n=== Step 4: Pick items (生产班长) ===")
    status, resp = request("POST", f"/requisitions/{req_id}/pick", token=token_prod, data={
        "items": [{"requisition_item_id": item_id, "picked_qty": 100, "batch_no": "B20260601-01"}]
    })
    print(f"  Status: {status}, Code: {resp['code']}, Msg: {resp['message']}")
    if resp["code"] == 0:
        print(f"  Status after pick: {resp['data']['status']}")
        print(f"  Picked by: {resp['data'].get('picked_by_user', {}).get('name', 'N/A')}")
        
        print("\n=== Step 5: Initiate allergen review (生产班长) ===")
        status, resp = request("POST", f"/requisitions/{req_id}/initiate-allergen-review", token=token_prod, data={})
        print(f"  Status: {status}, Code: {resp['code']}, Msg: {resp['message']}")
        if resp["code"] == 0:
            review_id = resp["data"]["review"]["id"]
            print(f"  Requisition status: {resp['data']['requisition']['status']}")
            print(f"  Review status: {resp['data']['review']['status']}")
            print(f"  Review items: {len(resp['data']['review']['check_items'])} items")
            
            check_item_id = resp["data"]["review"]["check_items"][0]["id"]
            
            print("\n=== Step 6: Submit allergen review (生产班长) ===")
            status, resp = request("POST", f"/allergen-reviews/{review_id}/submit", token=token_prod, data={
                "status": "passed",
                "overall_result": "过敏原复核通过",
                "findings": "所有物料标签清晰，批次可追溯",
                "corrective_actions": "无",
                "check_items": [{
                    "id": check_item_id,
                    "is_contained": True,
                    "label_verified": True,
                    "batch_verified": True,
                    "cross_contamination_risk": "低",
                    "remarks": "含麸质，已确认"
                }]
            })
            print(f"  Status: {status}, Code: {resp['code']}, Msg: {resp['message']}")
            if resp["code"] == 0:
                print(f"  Review status: {resp['data']['review']['status']}")
                print(f"  Requisition status: {resp['data']['requisition']['status']}")
                
                print("\n=== Step 7: Verify by 门店督导 ===")
                status, resp = request("POST", f"/allergen-reviews/{review_id}/verify", token=token_store, data={
                    "status": "passed",
                    "findings": "同意生产班长的复核结论",
                    "remarks": "可以投入生产"
                })
                print(f"  Status: {status}, Code: {resp['code']}, Msg: {resp['message']}")
                if resp["code"] == 0:
                    print(f"  Review status: {resp['data']['review']['status']}")
                    print(f"  Requisition status: {resp['data']['requisition']['status']}")
                    print(f"  Verified by: {resp['data']['review'].get('verified_by_user', {}).get('name', 'N/A')}")
                    
                    print("\n=== Step 8: Get requisition details ===")
                    status, resp = request("GET", f"/requisitions/{req_id}", token=token_store)
                    if resp["code"] == 0:
                        d = resp["data"]
                        print(f"  领用单号: {d['requisition_no']}")
                        print(f"  状态: {d['status']}")
                        print(f"  领用人: {d.get('picked_by_user', {}).get('name', 'N/A')}")
                        print(f"  生产复核: {d.get('allergen_checker_user', {}).get('name', 'N/A')}")
                        print(f"  门店确认: {d.get('store_verifier_user', {}).get('name', 'N/A')}")
                    
                    print("\n=== Step 9: Get action logs ===")
                    status, resp = request("GET", f"/requisitions/{req_id}/logs", token=token_store)
                    if resp["code"] == 0:
                        print(f"  共 {len(resp['data'])} 条操作记录")
                        for log in resp["data"]:
                            user = log.get("performed_by_user", {})
                            old = log.get("old_status", "")
                            new = log.get("new_status", "")
                            change = f" ({old} → {new})" if old and new else ""
                            print(f"    [{log['created_at'][:19]}] {user.get('name', 'N/A')} - {log['action_name']}{change}")
                    
                    print("\n=== Step 10: Get allergen review history ===")
                    status, resp = request("GET", "/allergen-reviews/history", token=token_store)
                    if resp["code"] == 0:
                        print(f"  共 {len(resp['data'])} 条复核记录")
                        for rev in resp["data"]:
                            req = rev.get("requisition", {})
                            print(f"    {req.get('requisition_no', 'N/A')}: {rev['status']} - {rev.get('overall_result', 'N/A')}")
                    
                    print("\n=== Step 11: Get error codes ===")
                    status, resp = request("GET", "/error-codes")
                    print(f"  共 {len(resp)} 类错误码")
                    for category in list(resp.keys())[:3]:
                        print(f"    {category}: {len(resp[category])} codes")

print("\n=== ✅ 测试完成！===")
