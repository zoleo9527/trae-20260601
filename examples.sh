#!/bin/bash
#
# 铁路货运站装车计划与车皮分配 - 请求示例
#
# 使用前请先启动服务: npx ts-node src/app.ts
#

BASE="http://localhost:3001/api"

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
echo ""

# ============================================
# 新增：卡单筛选、聚合摘要、角色待办视图
# ============================================
echo "============================================"
echo "📊  卡单筛选 / 聚合摘要 / 角色待办视图"
echo "============================================"
echo ""

# ============================================
# 7. 卡单过滤查询
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【7】卡单过滤：仅查 critical 级别"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/stuck-orders?severity=critical" | python3 -m json.tool 2>/dev/null || echo "(无 critical 卡单)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【7a】卡单过滤：按 stuckType 过滤"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/stuck-orders?stuckType=damage_no_photo" | python3 -m json.tool 2>/dev/null || echo "(无此类卡单)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【7b】卡单过滤：按 entityType + 时间范围"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SINCE=$(python3 -c "from datetime import datetime, timedelta; print((datetime.utcnow()-timedelta(days=7)).isoformat()+'Z')")
curl -s "${BASE}/stuck-orders?entityType=damage_record&since=${SINCE}" | python3 -m json.tool 2>/dev/null || echo "(无匹配)"
echo ""

# ============================================
# 8. 卡单聚合摘要
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【8】卡单聚合摘要（按 stuckType + severity）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/stuck-orders/summary" | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 9. 角色待办视图
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【9】装卸班长(loading_leader)待办视图"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/pending-tasks?role=loading_leader" | python3 -m json.tool 2>/dev/null
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【9a】货运员(freight_clerk)待办视图"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/pending-tasks?role=freight_clerk" | python3 -m json.tool 2>/dev/null
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【9b】客服(customer_service)待办视图"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/pending-tasks?role=customer_service" | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 新增：待办聚合摘要、待办筛选、卡单交接链
# ============================================
echo "============================================"
echo "📋  待办聚合 / 长期滞留筛选 / 卡单交接链"
echo "============================================"
echo ""

# ============================================
# 10. 待办聚合摘要
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【10】待办聚合摘要（按 role + entityType）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/pending-tasks/summary" | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 11. 待办筛选：仅被卡单阻断的待办
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【11】被卡单阻断的待办（blockedOnly=true）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/pending-tasks?role=customer_service&blockedOnly=true" | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 11a. 待办筛选：停留超过0小时的
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【11a】停留超过0小时的待办（minDwellHours=0）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/pending-tasks?role=loading_leader&minDwellHours=0" | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 12. 卡单交接链（需先获取一个卡单ID）
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【12】卡单交接链（获取卡单的完整交接留痕）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
STUCK_LIST=$(curl -s "${BASE}/stuck-orders")
STUCK_ID=$(echo "$STUCK_LIST" | python3 -c "import sys,json; items=json.load(sys.stdin); print(items[0]['id'] if items else '')" 2>/dev/null)
if [ -n "$STUCK_ID" ]; then
  echo "卡单ID: $STUCK_ID"
  curl -s "${BASE}/stuck-orders/${STUCK_ID}/trail" | python3 -m json.tool 2>/dev/null
else
  echo "(当前无活跃卡单，跳过 trail 测试)"
fi
echo ""

# ============================================
# 新增：批量结案、交接记录查询、卡单摘要汇总扩展
# ============================================
echo "============================================"
echo "🔧  批量结案 / 交接记录查询 / 摘要汇总扩展"
echo "============================================"
echo ""

# ============================================
# 13. 批量结案卡单
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【13】批量结案卡单（含不存在/已结案ID）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
STUCK_LIST=$(curl -s "${BASE}/stuck-orders")
REAL_STUCK_IDS=$(echo "$STUCK_LIST" | python3 -c "
import sys, json
items = json.load(sys.stdin)
ids = [i['id'] for i in items[:2]]
ids.append('00000000-0000-0000-0000-000000000000')
print(json.dumps(ids))
" 2>/dev/null)
echo "提交卡单IDs: $REAL_STUCK_IDS"
curl -s -X POST "${BASE}/stuck-orders/batch-resolve" \
  -H "Content-Type: application/json" \
  -d "{\"stuckIds\": ${REAL_STUCK_IDS}, \"resolution\": \"批量结案：运营人员统一确认处理\"}" | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 14. 交接记录查询（按角色和动作过滤）
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【14】交接记录查询（role=loading_leader, action=submit）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/handovers?role=loading_leader&action=submit" | python3 -m json.tool 2>/dev/null
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【14a】交接记录查询（entityType=damage_record）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/handovers?entityType=damage_record" | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 15. 卡单摘要汇总（含 totalActive + oldestUnresolvedAt）
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【15】卡单摘要汇总（含顶层 totalActive 和 oldestUnresolvedAt）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/stuck-orders/summary" | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 新增：卡单重开、交接聚合摘要、待办 reopenedCount
# ============================================
echo "============================================"
echo "🔓  卡单重开 / 交接聚合摘要 / 待办 reopenedCount"
echo "============================================"
echo ""

# ============================================
# 16. 卡单重开（需先有一个已结案的卡单ID）
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【16】先创建并结案一个卡单，再重开"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PLAN_R=$(curl -s -X POST "${BASE}/loading-plans" -H "Content-Type: application/json" -d '{"planNo":"ZC-REOPEN-001","freightTicketNo":"HP-REOPEN-001","cargoType":"矿石","cargoWeight":80,"cargoVolume":60,"plannedLoadDate":"2026-06-12","destinationStation":"株洲北","submittedBy":"clerk-wu"}')
PLAN_R_ID=$(echo "$PLAN_R" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan']['id'])" 2>/dev/null)
ALLOC_R=$(curl -s -X POST "${BASE}/wagon-allocations" -H "Content-Type: application/json" -d "{\"loadingPlanId\":\"$PLAN_R_ID\",\"wagonNo\":\"C80-RE1\",\"wagonType\":\"C80\",\"loadCapacity\":80,\"allocatedBy\":\"leader-sun\"}")
ALLOC_R_ID=$(echo "$ALLOC_R" | python3 -c "import sys,json; print(json.load(sys.stdin)['allocation']['id'])" 2>/dev/null)
DAMAGE_R=$(curl -s -X POST "${BASE}/damage-records" -H "Content-Type: application/json" -d "{\"loadingPlanId\":\"$PLAN_R_ID\",\"wagonAllocationId\":\"$ALLOC_R_ID\",\"reportedBy\":\"leader-sun\",\"damageType\":\"散落\",\"damageDescription\":\"2件散落\"}")
STUCK_R_ID=$(echo "$DAMAGE_R" | python3 -c "import sys,json; print(json.load(sys.stdin)['stuckOrders'][0]['id'])" 2>/dev/null)
echo "卡单ID: $STUCK_R_ID"
echo "--- 结案 ---"
curl -s -X PUT "${BASE}/stuck-orders/${STUCK_R_ID}/resolve" -H "Content-Type: application/json" -d '{"resolution":"已补充照片，结案"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'已结案: resolvedAt={d.get(\"resolvedAt\",\"?\")}')" 2>/dev/null
echo ""
echo "--- 重开 ---"
curl -s -X POST "${BASE}/stuck-orders/${STUCK_R_ID}/reopen" -H "Content-Type: application/json" -d '{"reason":"补充的照片不清晰，需重新拍照"}' | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 17. 交接聚合摘要
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【17】交接聚合摘要（按 role + action 双维度）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/handovers/summary" | python3 -m json.tool 2>/dev/null
echo ""

# ============================================
# 18. 待办视图含 reopenedCount
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【18】装卸班长待办视图（含 reopenedCount）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/pending-tasks?role=loading_leader" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'待办数: {len(d[\"tasks\"])}')
print(f'重开卡单数: {d[\"reopenedCount\"]}')
" 2>/dev/null
echo ""
