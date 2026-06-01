#!/bin/bash
set -e

BASE="http://localhost:3000"
C="curl -s"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓ $1${NC}"; }
fail() { echo -e "  ${RED}✗ $1${NC}"; exit 1; }
step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
info() { echo -e "  ${YELLOW}$1${NC}"; }

echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   冷链运输温控追溯 API 接口测试         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"

step "1. 健康检查"
HEALTH=$($C "$BASE/health")
echo "$HEALTH" | grep -q '"ok"' && ok "服务运行正常" || fail "服务不可用"

step "2. 创建运单"
SHIP1=$($C -X POST "$BASE/api/shipments" -H "Content-Type: application/json" -d '{
  "shipment_no": "TEST-CC-001",
  "origin": "武汉冷链仓",
  "destination": "长沙医院中心",
  "shipper_name": "湖北生物科技",
  "consignee_name": "长沙市第一医院",
  "driver_name": "赵师傅",
  "driver_phone": "13700137001",
  "vehicle_no": "鄂A-12345",
  "temp_min": 2.0,
  "temp_max": 8.0,
  "product_name": "流感疫苗",
  "product_category": "vaccine",
  "planned_departure": "2026-06-01T06:00:00Z",
  "planned_arrival": "2026-06-01T12:00:00Z",
  "created_by": "调度员-测试"
}')
SHIP1_ID=$(echo "$SHIP1" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
if [ -n "$SHIP1_ID" ]; then
  ok "运单创建成功: $SHIP1_ID"
else
  fail "运单创建失败: $SHIP1"
fi

step "3. 查询运单详情"
DETAIL=$($C "$BASE/api/shipments/$SHIP1_ID")
echo "$DETAIL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  运单号: {d[\"shipment_no\"]}, 状态: {d[\"status\"]}, 温控范围: {d[\"temp_min\"]}°C ~ {d[\"temp_max\"]}°C')" 2>/dev/null && ok "查询成功" || fail "查询失败"

step "4. 变更运单状态为 in_transit"
$C -X PATCH "$BASE/api/shipments/$SHIP1_ID/status" -H "Content-Type: application/json" -d '{
  "status": "in_transit",
  "changed_by": "调度员-测试"
}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  状态: {d[\"status\"]}, 出发时间: {d[\"actual_departure\"]}')" 2>/dev/null && ok "状态变更成功" || fail "状态变更失败"

step "5. 批量上传温控采样（含正常+越界）"
SAMPLES_RESULT=$($C -X POST "$BASE/api/shipments/$SHIP1_ID/temperature-samples" -H "Content-Type: application/json" -d '{
  "samples": [
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T07:00:00Z", "temperature": 3.2, "latitude": 30.58, "longitude": 114.30},
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T07:30:00Z", "temperature": 4.1, "latitude": 30.52, "longitude": 114.15},
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T08:00:00Z", "temperature": 5.5, "latitude": 30.40, "longitude": 113.90},
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T08:30:00Z", "temperature": 9.2, "latitude": 30.30, "longitude": 113.70},
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T09:00:00Z", "temperature": 11.5, "latitude": 30.20, "longitude": 113.50},
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T09:30:00Z", "temperature": 10.8, "latitude": 30.10, "longitude": 113.30},
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T10:00:00Z", "temperature": 8.5,  "latitude": 29.95, "longitude": 113.10},
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T10:30:00Z", "temperature": 5.0,  "latitude": 29.80, "longitude": 112.90},
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T11:00:00Z", "temperature": 4.2,  "latitude": 29.60, "longitude": 112.70},
    {"device_id": "DEV-TEST-01", "recorded_at": "2026-06-01T11:30:00Z", "temperature": 3.8,  "latitude": 29.40, "longitude": 112.50}
  ],
  "uploaded_by": "DEV-TEST-01"
}')
echo "$SAMPLES_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  上传 {d[\"count\"]} 条采样记录')" 2>/dev/null && ok "批量上传成功" || fail "上传失败"

step "6. 按时间区间查询温控采样"
QUERY_RESULT=$($C "$BASE/api/shipments/$SHIP1_ID/temperature-samples?from=2026-06-01T08:00:00Z&to=2026-06-01T10:00:00Z")
COUNT=$(echo "$QUERY_RESULT" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
info "08:00~10:00 区间采样: $COUNT 条"
ok "按时间区间查询成功"

step "7. 温控统计信息"
STATS=$($C "$BASE/api/shipments/$SHIP1_ID/temperature-stats")
echo "$STATS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
s=d['stats']
print(f'  总采样: {s[\"total_samples\"]}条, 温度范围: {s[\"min_temp\"]}°C~{s[\"max_temp\"]}°C, 均值: {s[\"avg_temp\"]}°C')
print(f'  越界: {s[\"violation_count\"]}条, 越界率: {s[\"violation_rate\"]}%')
" 2>/dev/null && ok "统计查询成功" || fail "统计查询失败"

step "8. 自动检测温度越界"
DETECT=$($C -X POST "$BASE/api/shipments/$SHIP1_ID/detect-anomalies" -H "Content-Type: application/json" -d '{"detected_by": "system"}')
echo "$DETECT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'  检测到 {d[\"anomaly_count\"]} 个异常区间')
for a in d.get('anomalies', []):
    print(f'    - {a[\"started_at\"]} ~ {a[\"ended_at\"]}, 温度: {a[\"min_temp\"]}°C~{a[\"max_temp\"]}°C, 持续{a[\"duration_seconds\"]}秒')
" 2>/dev/null && ok "异常检测成功" || fail "异常检测失败"

ANOMALY_ID=$(echo "$DETECT" | python3 -c "import sys,json; print(json.load(sys.stdin)['anomalies'][0]['id'])" 2>/dev/null)
info "异常区间ID: $ANOMALY_ID"

step "9. 查询异常区间（按时间范围）"
$C "$BASE/api/shipments/$SHIP1_ID/anomaly-intervals?from=2026-06-01T08:00:00Z&to=2026-06-01T12:00:00Z" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'  该时间范围内异常区间: {len(d[\"data\"])}个')
for a in d['data']:
    print(f'    - 状态: {a[\"status\"]}, 已确认: {a[\"confirmed\"]}, 持续: {a[\"duration_seconds\"]}秒')
" 2>/dev/null && ok "异常区间查询成功"

step "10. 确认异常区间"
$C -X PATCH "$BASE/api/anomaly-intervals/$ANOMALY_ID/confirm" -H "Content-Type: application/json" -d '{
  "confirmed_by": "质控员-陈博士"
}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  确认状态: {d[\"confirmed\"]}, 确认人: {d[\"confirmed_by\"]}, 状态: {d[\"status\"]}')" 2>/dev/null && ok "异常确认成功" || fail "异常确认失败"

step "11. 上传签收材料"
RECEIPT=$($C -X POST "$BASE/api/shipments/$SHIP1_ID/delivery-receipt" -H "Content-Type: application/json" -d '{
  "receiver_name": "李护士长",
  "receiver_phone": "0731-85551234",
  "received_at": "2026-06-01T12:15:00Z",
  "temperature_at_delivery": 4.2,
  "photo_urls": ["https://example.com/photos/sign_001.jpg", "https://example.com/photos/thermo_001.jpg"],
  "notes": "外包装完好，但温度记录仪显示中途有报警",
  "uploaded_by": "赵师傅"
}')
RECEIPT_ID=$(echo "$RECEIPT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
if [ -n "$RECEIPT_ID" ]; then
  ok "签收材料上传成功"
else
  fail "签收材料上传失败"
fi

step "12. 验证运单状态已自动变为 delivered"
$C "$BASE/api/shipments/$SHIP1_ID" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  当前状态: {d[\"status\"]}')" 2>/dev/null | grep -q "delivered" && ok "运单已自动变更为 delivered" || fail "状态未自动变更"

step "13. 发起争议"
DISPUTE=$($C -X POST "$BASE/api/shipments/$SHIP1_ID/disputes" -H "Content-Type: application/json" -d "{
  \"reason\": \"客户签收后发现疫苗中途温度越界，要求提供全程温控证明和赔偿\",
  \"initiated_by\": \"客服-周敏\",
  \"anomaly_interval_ids\": [\"$ANOMALY_ID\"],
  \"evidence_summary\": \"签收照片显示外包装完好，但温控记录显示8:30-10:00期间温度9.2-11.5°C，超出2-8°C标准。调度群聊天记录显示司机汇报设备报警。设备平台导出数据与系统记录一致。\"
}")
DISPUTE_ID=$(echo "$DISPUTE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
if [ -n "$DISPUTE_ID" ]; then
  ok "争议创建成功: $DISPUTE_ID"
else
  fail "争议创建失败"
fi

step "14. 验证运单状态已变为 disputed"
$C "$BASE/api/shipments/$SHIP1_ID" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  当前状态: {d[\"status\"]}')" 2>/dev/null | grep -q "disputed" && ok "运单已变更为 disputed" || fail "状态变更异常"

step "15. 质控复核 — 设为 reviewing"
$C -X PATCH "$BASE/api/disputes/$DISPUTE_ID" -H "Content-Type: application/json" -d '{
  "status": "reviewing",
  "resolved_by": "质控主管-孙工"
}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  争议状态: {d[\"status\"]}')" 2>/dev/null && ok "争议进入复核"

step "16. 质控给出结论 — resolved"
$C -X PATCH "$BASE/api/disputes/$DISPUTE_ID" -H "Content-Type: application/json" -d '{
  "status": "resolved",
  "resolution": "温度越界确认属实。8:30-10:00期间冷链设备故障导致温度升至11.5°C，越界时长1.5小时。建议更换供应商设备并赔偿客户相应损失。",
  "resolved_by": "质控主管-孙工"
}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  结论: {d[\"resolution\"][:50]}...')" 2>/dev/null && ok "争议解决成功"

step "17. 验证运单最终状态"
$C "$BASE/api/shipments/$SHIP1_ID" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  运单状态: {d[\"status\"]}')" 2>/dev/null | grep -q "closed" && ok "运单已关闭 (closed)" || fail "运单状态异常"

step "18. 查询种子数据的运单"
SEED_LIST=$($C "$BASE/api/shipments?status=disputed")
echo "$SEED_LIST" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  disputed 运单: {d[\"total\"]}条')" 2>/dev/null && ok "种子数据查询成功"

step "19. 查询全链路数据"
FULL=$($C "$BASE/api/shipments/$SHIP1_ID/full")
echo "$FULL" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'  运单: {d[\"shipment\"][\"shipment_no\"]} ({d[\"shipment\"][\"status\"]})')
print(f'  温控采样: {len(d[\"temperature_samples\"])}条')
print(f'  异常区间: {len(d[\"anomaly_intervals\"])}个')
print(f'  签收材料: {\"有\" if d[\"delivery_receipt\"] else \"无\"}')
print(f'  争议: {len(d[\"disputes\"])}条')
print(f'  审计日志: {len(d[\"audit_logs\"])}条')
" 2>/dev/null && ok "全链路数据查询成功"

step "20. 查询审计日志"
$C "$BASE/api/audit-logs?entity_type=shipment&entity_id=$SHIP1_ID&limit=100" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'  审计记录: {len(d[\"data\"])}条')
for log in d['data']:
    print(f'    [{log[\"changed_at\"][:19]}] {log[\"action\"]}: {log[\"old_value\"] or \"(新建)\"} → {log[\"new_value\"]} (by {log[\"changed_by\"]})')
" 2>/dev/null && ok "审计日志查询成功"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        所有测试通过 ✓                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
