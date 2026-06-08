#!/bin/bash
#
# 铁路货运站装车计划与车皮分配 - 请求示例
#
# 使用前请先启动服务: npx ts-node src/app.ts
#

BASE="http://localhost:3000/api"

echo "============================================"
echo "🚂  铁路货运站 - 装车计划与车皮分配 请求示例"
echo "============================================"
echo ""

# ============================================
# 1. 正常流程：货运员提交装车计划 → 装卸班长确认
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【1】货运员提交装车计划（幂等提交）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PLAN_RESULT=$(curl -s -X POST "${BASE}/loading-plans" \
  -H "Content-Type: application/json" \
  -d '{
    "planNo": "ZC-2026-0608-001",
    "freightTicketNo": "HP-2026-0608-001",
    "cargoType": "钢材",
    "cargoWeight": 60,
    "cargoVolume": 45,
    "plannedLoadDate": "2026-06-09",
    "destinationStation": "郑州北",
    "submittedBy": "clerk-zhang",
    "idempotencyKey": "idem-zc-001"
  }')
echo "$PLAN_RESULT" | python3 -m json.tool 2>/dev/null || echo "$PLAN_RESULT"

PLAN_ID=$(echo "$PLAN_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan']['id'])" 2>/dev/null)
echo ""
echo "  → 装车计划ID: $PLAN_ID"
echo ""

# 幂等测试：用相同 idempotencyKey 再次提交
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【2】幂等提交测试（相同 idempotencyKey 重复提交）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
IDEM_RESULT=$(curl -s -X POST "${BASE}/loading-plans" \
  -H "Content-Type: application/json" \
  -d '{
    "planNo": "ZC-2026-0608-001",
    "freightTicketNo": "HP-2026-0608-001",
    "cargoType": "钢材",
    "cargoWeight": 60,
    "cargoVolume": 45,
    "plannedLoadDate": "2026-06-09",
    "destinationStation": "郑州北",
    "submittedBy": "clerk-zhang",
    "idempotencyKey": "idem-zc-001"
  }')
echo "$IDEM_RESULT" | python3 -m json.tool 2>/dev/null || echo "$IDEM_RESULT"
echo ""

# ============================================
# 3. 分配车皮
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【3】分配车皮（幂等提交）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ALLOC_RESULT=$(curl -s -X POST "${BASE}/wagon-allocations" \
  -H "Content-Type: application/json" \
  -d "{
    \"loadingPlanId\": \"$PLAN_ID\",
    \"wagonNo\": \"C80-1234567\",
    \"wagonType\": \"C80\",
    \"loadCapacity\": 80,
    \"allocatedBy\": \"leader-wang\",
    \"idempotencyKey\": \"idem-alloc-001\"
  }")
echo "$ALLOC_RESULT" | python3 -m json.tool 2>/dev/null || echo "$ALLOC_RESULT"

ALLOC_ID=$(echo "$ALLOC_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['allocation']['id'])" 2>/dev/null)
echo ""
echo "  → 车皮分配ID: $ALLOC_ID"
echo ""

# ============================================
# 4. 装卸班长确认车皮分配
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【4】装卸班长确认车皮分配"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CONFIRM_RESULT=$(curl -s -X PUT "${BASE}/wagon-allocations/${ALLOC_ID}/confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmedBy": "leader-wang",
    "actualLoadWeight": 58
  }')
echo "$CONFIRM_RESULT" | python3 -m json.tool 2>/dev/null || echo "$CONFIRM_RESULT"
echo ""

# ============================================
# 5. 查看车皮分配回看
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【5】车皮分配回看（含交接留痕）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HISTORY_RESULT=$(curl -s "${BASE}/wagon-allocations/plan/${PLAN_ID}/history")
echo "$HISTORY_RESULT" | python3 -m json.tool 2>/dev/null || echo "$HISTORY_RESULT"
echo ""

# ============================================
# 6. 查看交接留痕
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【6】查看装车计划交接留痕（谁提交、谁确认）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HANDOVER_RESULT=$(curl -s "${BASE}/handovers/loading_plan/${PLAN_ID}")
echo "$HANDOVER_RESULT" | python3 -m json.tool 2>/dev/null || echo "$HANDOVER_RESULT"
echo ""

echo "============================================"
echo "⚠️  异常触发样例"
echo "============================================"
echo ""

# ============================================
# 异常1：货损记录缺照片 → 立即触发 critical 卡单
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【异常1】录入货损记录（缺照片）→ 立即触发卡单"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DAMAGE_RESULT=$(curl -s -X POST "${BASE}/damage-records" \
  -H "Content-Type: application/json" \
  -d "{
    \"loadingPlanId\": \"$PLAN_ID\",
    \"wagonAllocationId\": \"$ALLOC_ID\",
    \"reportedBy\": \"leader-wang\",
    \"damageType\": \"包装破损\",
    \"damageDescription\": \"3件钢材包装破损，需拍照认定责任\"
  }")
echo "$DAMAGE_RESULT" | python3 -m json.tool 2>/dev/null || echo "$DAMAGE_RESULT"
echo ""

DAMAGE_ID=$(echo "$DAMAGE_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['record']['id'])" 2>/dev/null)

# ============================================
# 查看活跃卡单
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【异常1续】查看当前活跃卡单（缺照片卡单已暴露）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
STUCK_RESULT=$(curl -s "${BASE}/stuck-orders")
echo "$STUCK_RESULT" | python3 -m json.tool 2>/dev/null || echo "$STUCK_RESULT"
echo ""

STUCK_ID=$(echo "$STUCK_RESULT" | python3 -c "import sys,json; items=json.load(sys.stdin); print(items[0]['id'] if items else '')" 2>/dev/null)

# ============================================
# 异常1解除：补充照片
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【异常1解除】补充货损照片 → 卡单自动解除"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PHOTO_RESULT=$(curl -s -X PUT "${BASE}/damage-records/${DAMAGE_ID}/photos" \
  -H "Content-Type: application/json" \
  -d '{
    "photoUrls": ["https://oss.example.com/damage/photo1.jpg", "https://oss.example.com/damage/photo2.jpg"]
  }')
echo "$PHOTO_RESULT" | python3 -m json.tool 2>/dev/null || echo "$PHOTO_RESULT"
echo ""

# ============================================
# 异常2：装卸班长退回装车计划
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【异常2】装卸班长退回装车计划"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RETURN_PLAN_RESULT=$(curl -s -X POST "${BASE}/loading-plans" \
  -H "Content-Type: application/json" \
  -d '{
    "planNo": "ZC-2026-0608-002",
    "freightTicketNo": "HP-2026-0608-002",
    "cargoType": "煤炭",
    "cargoWeight": 70,
    "cargoVolume": 55,
    "plannedLoadDate": "2026-06-10",
    "destinationStation": "西安西",
    "submittedBy": "clerk-li"
  }')
RETURN_PLAN_ID=$(echo "$RETURN_PLAN_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan']['id'])" 2>/dev/null)

RETURN_RESULT=$(curl -s -X PUT "${BASE}/loading-plans/${RETURN_PLAN_ID}/return" \
  -H "Content-Type: application/json" \
  -d '{
    "returnedBy": "leader-zhao",
    "reason": "到站信息有误，请货运员核实后重新提交"
  }')
echo "$RETURN_RESULT" | python3 -m json.tool 2>/dev/null || echo "$RETURN_RESULT"
echo ""

# ============================================
# 异常3：装车计划变更 → 触发变更检测
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【异常3】装车计划变更（触发变更追踪和卡单检测）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CHANGE_RESULT=$(curl -s -X PUT "${BASE}/loading-plans/${PLAN_ID}/change" \
  -H "Content-Type: application/json" \
  -d '{
    "changeReason": "客户要求变更到站，从郑州北改为洛阳东",
    "changedBy": "clerk-zhang",
    "changes": {
      "destinationStation": "洛阳东"
    }
  }')
echo "$CHANGE_RESULT" | python3 -m json.tool 2>/dev/null || echo "$CHANGE_RESULT"
echo ""

# ============================================
# 最终：查看全量卡单
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【最终】查看全量卡单（所有卡住的流程已暴露）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
FINAL_STUCK=$(curl -s "${BASE}/stuck-orders")
echo "$FINAL_STUCK" | python3 -m json.tool 2>/dev/null || echo "$FINAL_STUCK"
echo ""

echo "============================================"
echo "✅ 请求示例执行完毕"
echo "============================================"
