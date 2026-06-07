#!/bin/bash

BASE_URL="http://localhost:3001/api"

# 先找一个 SUBMITTED 状态的单子
echo "=== 测试场景：状态正确但角色不对（越级操作）==="
echo ""

# 重新找一个 REJECTED 的单子重新提交
CASE_ID=$(curl -s "$BASE_URL/disease-cases" | python3 -c "import json,sys; cases=json.load(sys.stdin); [print(c['id']) for c in cases if c['status']=='REJECTED']" | head -1)
if [ -z "$CASE_ID" ]; then
  # 如果没有 REJECTED 的，就找一个 CLOSED 以上状态的也可以
  CASE_ID=$(curl -s "$BASE_URL/disease-cases" | python3 -c "import json,sys; cases=json.load(sys.stdin); print(cases[0]['id'])")
fi
echo "测试用病害单 ID: $CASE_ID"

# 先提交到 SUBMITTED 状态（如果是 REJECTED）
STATUS=$(curl -s "$BASE_URL/disease-cases/$CASE_ID" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['status'])")
echo "当前状态: $STATUS"

if [ "$STATUS" = "REJECTED" ]; then
  curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/submit" \
    -H "Content-Type: application/json" \
    -H "x-idempotency-key: test-submit-$(date +%s)" \
    -d '{"operatorId": "ad7ade4d-ebca-458f-b0fc-0d23520a58a4"}' > /dev/null
  echo "已重新提交到 SUBMITTED 状态"
fi

echo ""
echo "=== 测试1: 技术员尝试配药（SUBMITTED状态正确，但角色是技术员，处理角色应该是仓管）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/allocate-medicine" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-tech-alloc-$(date +%s)" \
  -d '{"operatorId": "97977287-b903-4039-8d8a-fc2ea442ecda", "medicines": [{"id": "6a1379cd-5017-43c8-bf76-796ce5e0e79a", "actualQuantity": 2}]}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('❌ 拦截结果:', d.get('error', d.get('message', '无')))"

echo ""
echo "=== 测试2: 仓管正常配药（角色和处理角色一致）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/allocate-medicine" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-kpr-alloc-$(date +%s)" \
  -d '{"operatorId": "7396b57c-a055-47b9-855a-606cd1bba6ba", "medicines": [{"id": "6a1379cd-5017-43c8-bf76-796ce5e0e79a", "actualQuantity": 2}]}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('✅ 正常操作 | 状态:', d.get('status'), '| 处理角色:', d.get('current_handler_role'))"

echo ""
echo "=== 测试3: 仓管尝试审批（MEDICINE_ALLOCATED状态正确，但角色是仓管，处理角色应该是场长）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/approve" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-kpr-approve-$(date +%s)" \
  -d '{"operatorId": "7396b57c-a055-47b9-855a-606cd1bba6ba"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('❌ 拦截结果:', d.get('error', d.get('message', '无')))"

echo ""
echo "=== 测试4: 技术员尝试审批（MEDICINE_ALLOCATED状态正确，但角色是技术员，处理角色应该是场长）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/approve" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-tech-approve-$(date +%s)" \
  -d '{"operatorId": "97977287-b903-4039-8d8a-fc2ea442ecda"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('❌ 拦截结果:', d.get('error', d.get('message', '无')))"

echo ""
echo "=== 测试5: 场长正常审批（角色和处理角色一致）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/approve" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-mgr-approve-$(date +%s)" \
  -d '{"operatorId": "001f05a1-c8ba-444c-b2a8-b6dd4938be8b"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('✅ 正常操作 | 状态:', d.get('status'), '| 处理角色:', d.get('current_handler_role'))"

echo ""
echo "========================================="
echo "✅ handler_role 校验测试完成！"
