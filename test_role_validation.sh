#!/bin/bash

BASE_URL="http://localhost:3001/api"

# 先找一个 REJECTED 状态的单子，重新提交变成 SUBMITTED（当前处理角色=仓管）
CASE_ID=$(curl -s "$BASE_URL/disease-cases" | python3 -c "import json,sys; cases=json.load(sys.stdin); [print(c['id']) for c in cases if c['status']=='REJECTED']" | head -1)
echo "测试用病害单 ID: $CASE_ID"
echo ""

# 技术员重新提交
echo "=== 步骤1: 技术员重新提交（REJECTED → SUBMITTED）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/submit" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-submit-$(date +%s)" \
  -d '{"operatorId": "ad7ade4d-ebca-458f-b0fc-0d23520a58a4"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('状态:', d['status'], '| 当前处理角色:', d['current_handler_role'])"
echo ""

# 测试1: 场长在 SUBMITTED 状态尝试审批（越级，应该失败）
echo "=== 测试1: 场长越级审批（当前处理角色是仓管）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/approve" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-approve-$(date +%s)" \
  -d '{"operatorId": "001f05a1-c8ba-444c-b2a8-b6dd4938be8b"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('❌ 拦截成功:', d.get('error', d.get('message', '无')))"
echo ""

# 测试2: 技术员在 SUBMITTED 状态尝试记录用药（越级，应该失败）
echo "=== 测试2: 技术员越级记录用药（当前处理角色是仓管）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/record-medication" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-med-$(date +%s)" \
  -d '{"operatorId": "97977287-b903-4039-8d8a-fc2ea442ecda", "medicationDate": "2026-06-07"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('❌ 拦截成功:', d.get('error', d.get('message', '无')))"
echo ""

# 步骤2: 仓管正常配药
echo "=== 步骤3: 仓管正常配药（SUBMITTED → MEDICINE_ALLOCATED）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/allocate-medicine" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-alloc-$(date +%s)" \
  -d '{"operatorId": "7396b57c-a055-47b9-855a-606cd1bba6ba", "medicines": [{"id": "6a1379cd-5017-43c8-bf76-796ce5e0e79a", "actualQuantity": 2.5}]}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('✅ 配药成功 | 状态:', d['status'], '| 当前处理角色:', d['current_handler_role'])"
echo ""

# 测试3: 仓管在 MEDICINE_ALLOCATED 状态尝试再配药（越级，应该失败）
echo "=== 测试4: 仓管越级重复配药（当前处理角色是场长）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/allocate-medicine" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-alloc2-$(date +%s)" \
  -d '{"operatorId": "7396b57c-a055-47b9-855a-606cd1bba6ba", "medicines": [{"id": "6a1379cd-5017-43c8-bf76-796ce5e0e79a", "actualQuantity": 1}]}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('❌ 拦截成功:', d.get('error', d.get('message', '无')))"
echo ""

# 步骤4: 场长正常审批
echo "=== 步骤5: 场长正常审批（MEDICINE_ALLOCATED → APPROVED）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/approve" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-approve2-$(date +%s)" \
  -d '{"operatorId": "001f05a1-c8ba-444c-b2a8-b6dd4938be8b", "remark": "同意用药方案"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('✅ 审批成功 | 状态:', d['status'], '| 当前处理角色:', d['current_handler_role'])"
echo ""

# 测试5: 场长在 APPROVED 状态尝试结案（越级，应该失败）
echo "=== 测试6: 场长越级结案（当前处理角色是技术员）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/close" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-close-$(date +%s)" \
  -d '{"operatorId": "001f05a1-c8ba-444c-b2a8-b6dd4938be8b"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('❌ 拦截成功:', d.get('error', d.get('message', '无')))"
echo ""

echo "========================================="
echo "✅ 所有越级操作拦截测试完成！"
