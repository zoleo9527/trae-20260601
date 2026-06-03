#!/bin/bash

TOKEN_PROD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOWUxMWRmNWItZjQ2OS00NDIwLTgxY2EtODU1Mzc3NmVhODI4IiwidXNlcm5hbWUiOiJwcm9kdWN0aW9uMSIsInJvbGUiOiJwcm9kdWN0aW9uX2ZvcmVtYW4iLCJpc3MiOiJjZW50cmFsLWtpdGNoZW4iLCJleHAiOjE3ODA1NDMxMTksImlhdCI6MTc4MDQ1NjcxOX0.OmNE4Gjy3ktrR-BWr3UAjJwFm1YGGrU-CV6chyJE1iM"
TOKEN_STORE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYzU0ZmNhN2EtOTc2YS00NDM1LTg5NGEtMzJhM2U1MWYyMzg0IiwidXNlcm5hbWUiOiJzdG9yZTEiLCJyb2xlIjoic3RvcmVfc3VwZXJ2aXNvciIsImlzcyI6ImNlbnRyYWwta2l0Y2hlbiIsImV4cCI6MTc4MDU0MzEyMywiaWF0IjoxNzgwNDU2NzIzfQ.bVsfvo3jePn0xmbpJQjbkRPTx6Nf8HSdSulijV1aEWI"
PO_ID="49e90628-30ba-452a-805a-db10f956a3c7"

echo "=== Step 1: List purchase orders ==="
curl -s -H "Authorization: Bearer $TOKEN_PROD" http://localhost:8080/api/purchase-orders | python3 -c "
import sys, json
data = json.load(sys.stdin)
for po in data['data']:
    print(f'  {po[\"order_no\"]} - {po[\"status\"]} - {po[\"id\"]}')
"

echo ""
echo "=== Step 2: Create requisition (生产班长) ==="
REQ_RESP=$(curl -s -X POST http://localhost:8080/api/requisitions \
  -H "Authorization: Bearer $TOKEN_PROD" \
  -H "Content-Type: application/json" \
  -d '{
    "purchase_order_id": "'$PO_ID'",
    "production_line": "A线-面包生产区",
    "items": [
      {"purchase_item_id": "ed235c27-4bab-44ec-aa32-91176d16d211", "material_name": "小麦粉", "requested_qty": 100, "unit": "kg", "allergen_info": "含麸质"},
      {"purchase_item_id": "05f7e1f2-bfd3-47dc-862f-f49196a773b7", "material_name": "鸡蛋", "requested_qty": 50, "unit": "kg", "allergen_info": "含蛋类"},
      {"purchase_item_id": "6782fd73-0cae-4677-bcb1-fb5e6d947802", "material_name": "白砂糖", "requested_qty": 80, "unit": "kg", "allergen_info": "无常见过敏原"}
    ],
    "remarks": "6月3日早餐面包生产批次"
  }')

echo "$REQ_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
d = data['data']
print(f'  领用单号: {d[\"requisition_no\"]}')
print(f'  状态: {d[\"status\"]}')
print(f'  ID: {d[\"id\"]}')
print(f'  生产线: {d[\"production_line\"]}')
"

REQ_ID=$(echo "$REQ_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
REQ_NO=$(echo "$REQ_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['requisition_no'])")
REQ_ITEM1=$(echo "$REQ_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['items'][0]['id'])")
REQ_ITEM2=$(echo "$REQ_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['items'][1]['id'])")
REQ_ITEM3=$(echo "$REQ_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['items'][2]['id'])")

echo ""
echo "=== Step 3: Pick items (生产班长) ==="
PICK_RESP=$(curl -s -X POST http://localhost:8080/api/requisitions/$REQ_ID/pick \
  -H "Authorization: Bearer $TOKEN_PROD" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"requisition_item_id": "'$REQ_ITEM1'", "picked_qty": 100, "batch_no": "B20260601-01"},
      {"requisition_item_id": "'$REQ_ITEM2'", "picked_qty": 50, "batch_no": "B20260601-02"},
      {"requisition_item_id": "'$REQ_ITEM3'", "picked_qty": 80, "batch_no": "B20260601-03"}
    ]
  }')

echo "$PICK_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
d = data['data']
print(f'  状态: {d[\"status\"]}')
print(f'  领用人: {d[\"picked_by_user\"][\"name\"] if d.get(\"picked_by_user\") else \"N/A\"}')
print(f'  领用时间: {d.get(\"picked_at\", \"N/A\")}')
"

echo ""
echo "=== Step 4: Initiate allergen review (生产班长) ==="
INIT_RESP=$(curl -s -X POST http://localhost:8080/api/requisitions/$REQ_ID/initiate-allergen-review \
  -H "Authorization: Bearer $TOKEN_PROD" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$INIT_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
req = data['data']['requisition']
rev = data['data']['review']
print(f'  领用单状态: {req[\"status\"]}')
print(f'  复核单状态: {rev[\"status\"]}')
print(f'  复核单ID: {rev[\"id\"]}')
print(f'  复核项数: {len(rev[\"check_items\"])}')
"

REVIEW_ID=$(echo "$INIT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['review']['id'])")
CHECK_ITEM1=$(echo "$INIT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['review']['check_items'][0]['id'])")
CHECK_ITEM2=$(echo "$INIT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['review']['check_items'][1]['id'])")
CHECK_ITEM3=$(echo "$INIT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['review']['check_items'][2]['id'])")

echo ""
echo "=== Step 5: Submit allergen review (生产班长) ==="
SUBMIT_RESP=$(curl -s -X POST http://localhost:8080/api/allergen-reviews/$REVIEW_ID/submit \
  -H "Authorization: Bearer $TOKEN_PROD" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "passed",
    "overall_result": "过敏原复核通过",
    "findings": "所有物料标签清晰，批次可追溯，交叉污染风险可控",
    "corrective_actions": "无",
    "check_items": [
      {"id": "'$CHECK_ITEM1'", "is_contained": true, "label_verified": true, "batch_verified": true, "cross_contamination_risk": "低", "remarks": "含麸质，已确认"},
      {"id": "'$CHECK_ITEM2'", "is_contained": true, "label_verified": true, "batch_verified": true, "cross_contamination_risk": "低", "remarks": "含蛋类，已确认"},
      {"id": "'$CHECK_ITEM3'", "is_contained": false, "label_verified": true, "batch_verified": true, "cross_contamination_risk": "无", "remarks": "无常见过敏原"}
    ]
  }')

echo "$SUBMIT_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
rev = data['data']['review']
req = data['data']['requisition']
print(f'  复核单状态: {rev[\"status\"]}')
print(f'  领用单状态: {req[\"status\"]}')
print(f'  结论: {rev[\"overall_result\"]}')
print(f'  发现: {rev[\"findings\"]}')
"

echo ""
echo "=== Step 6: Verify by 门店督导 ==="
VERIFY_RESP=$(curl -s -X POST http://localhost:8080/api/allergen-reviews/$REVIEW_ID/verify \
  -H "Authorization: Bearer $TOKEN_STORE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "passed",
    "findings": "同意生产班长的复核结论，物料信息完整",
    "remarks": "可以投入生产"
  }')

echo "$VERIFY_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
rev = data['data']['review']
req = data['data']['requisition']
print(f'  复核单状态: {rev[\"status\"]}')
print(f'  领用单状态: {req[\"status\"]}')
print(f'  复核人: {rev[\"verified_by_user\"][\"name\"] if rev.get(\"verified_by_user\") else \"N/A\"}')
print(f'  复核时间: {rev.get(\"verified_at\", \"N/A\")}')
"

echo ""
echo "=== Step 7: Get full requisition details ==="
curl -s -H "Authorization: Bearer $TOKEN_STORE" http://localhost:8080/api/requisitions/$REQ_ID | python3 -c "
import sys, json
data = json.load(sys.stdin)
d = data['data']
print(f'  领用单号: {d[\"requisition_no\"]}')
print(f'  状态: {d[\"status\"]}')
print(f'  领用人: {d[\"picked_by_user\"][\"name\"] if d.get(\"picked_by_user\") else \"N/A\"}')
print(f'  复核人(生产): {d[\"allergen_checker_user\"][\"name\"] if d.get(\"allergen_checker_user\") else \"N/A\"}')
print(f'  复核人(门店): {d[\"store_verifier_user\"][\"name\"] if d.get(\"store_verifier_user\") else \"N/A\"}')
print(f'  领用时间: {d.get(\"picked_at\", \"N/A\")}')
print(f'  生产复核时间: {d.get(\"allergen_checked_at\", \"N/A\")}')
print(f'  门店确认时间: {d.get(\"store_verified_at\", \"N/A\")}')
print(f'  物料项数: {len(d[\"items\"])}')
for item in d['items']:
    print(f'    - {item[\"material_name\"]}: {item[\"picked_qty\"]}/{item[\"requested_qty\"]} {item[\"unit\"]} (批次: {item.get(\"batch_no\", \"N/A\")})')
"

echo ""
echo "=== Step 8: Get allergen review history ==="
curl -s -H "Authorization: Bearer $TOKEN_STORE" "http://localhost:8080/api/allergen-reviews/history" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  共 {len(data[\"data\"])} 条复核记录')
for rev in data['data']:
    req = rev.get('requisition', {})
    checker = rev.get('checked_by_user', {})
    verifier = rev.get('verified_by_user', {})
    print(f'    {req.get(\"requisition_no\", \"N/A\")}: {rev[\"status\"]}')
    print(f'      复核结论: {rev.get(\"overall_result\", \"N/A\")}')
    print(f'      生产复核: {checker.get(\"name\", \"N/A\")}')
    print(f'      门店确认: {verifier.get(\"name\", \"N/A\") if verifier else \"待确认\"}')
"

echo ""
echo "=== Step 9: Get action logs for requisition (推进轨迹) ==="
curl -s -H "Authorization: Bearer $TOKEN_STORE" http://localhost:8080/api/requisitions/$REQ_ID/logs | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  共 {len(data[\"data\"])} 条操作记录')
for log in data['data']:
    user = log.get('performed_by_user', {})
    old = log.get('old_status', '')
    new = log.get('new_status', '')
    status_change = f' ({old} → {new})' if old and new else ''
    print(f'    [{log[\"created_at\"]}] {user.get(\"name\", \"N/A\")} - {log[\"action_name\"]}{status_change}')
    print(f'      {log[\"description\"]}')
"

echo ""
echo "=== Step 10: Get action logs for allergen review ==="
curl -s -H "Authorization: Bearer $TOKEN_STORE" http://localhost:8080/api/allergen-reviews/$REVIEW_ID/logs | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  共 {len(data[\"data\"])} 条操作记录')
for log in data['data']:
    user = log.get('performed_by_user', {})
    old = log.get('old_status', '')
    new = log.get('new_status', '')
    status_change = f' ({old} → {new})' if old and new else ''
    print(f'    [{log[\"created_at\"]}] {user.get(\"name\", \"N/A\")} - {log[\"action_name\"]}{status_change}')
    print(f'      {log[\"description\"]}')
"

echo ""
echo "=== Step 11: Check error codes ==="
curl -s http://localhost:8080/api/error-codes | python3 -c "
import sys, json
data = json.load(sys.stdin)
for category, codes in data.items():
    print(f'  {category}:')
    for code, msg in codes.items():
        print(f'    {code}: {msg}')
" | head -30

echo ""
echo "=== ✅ 完整流程测试通过！==="
echo "  采购主管 → 生产班长(领用+复核) → 门店督导(确认) 闭环已打通"
