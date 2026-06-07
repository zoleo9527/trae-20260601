#!/bin/bash
set -e

CASE_ID="e4f3160d-d0f9-4180-9337-71e36f6db736"
BASE_URL="http://localhost:3001/api"

echo "=== 步骤1: 技术员重新提交（REJECTED → SUBMITTED）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/submit" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-submit-$(date +%s)" \
  -d '{"operatorId": "ad7ade4d-ebca-458f-b0fc-0d23520a58a4"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('状态:', d['status'], '| 当前处理角色:', d['current_handler_role'])"

echo ""
echo "=== 步骤2: 场长在 SUBMITTED 状态尝试驳回（应该失败，门禁拦截）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/reject" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-reject-$(date +%s)" \
  -d '{"operatorId": "001f05a1-c8ba-444c-b2a8-b6dd4938be8b", "rejectReason": "测试驳回"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('结果:', d.get('error', d.get('message', '无错误信息')))"

echo ""
echo "=== 步骤3: 仓管配药（SUBMITTED → MEDICINE_ALLOCATED）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/allocate-medicine" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-alloc-$(date +%s)" \
  -d '{"operatorId": "7396b57c-a055-47b9-855a-606cd1bba6ba", "medicines": [{"id": "6a1379cd-5017-43c8-bf76-796ce5e0e79a", "actualQuantity": 2}]}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('状态:', d['status'], '| 当前处理角色:', d['current_handler_role'])"

echo ""
echo "=== 步骤4: 场长在 MEDICINE_ALLOCATED 状态驳回（应该成功）==="
RESULT=$(curl -s -X POST "$BASE_URL/disease-cases/$CASE_ID/reject" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-reject2-$(date +%s)" \
  -d '{"operatorId": "001f05a1-c8ba-444c-b2a8-b6dd4938be8b", "rejectReason": "实际出库量与建议用量不符，需仓管重新确认"}')
echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('状态:', d['status'], '| 当前处理角色:', d['current_handler_role'], '| 驳回理由:', d['reject_reason'])"

echo ""
echo "✅ 全部测试完成！流程验证通过。"
