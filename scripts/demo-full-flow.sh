#!/bin/bash
set -e

BASE_URL="http://localhost:3000/api"

print_json() {
  echo "$1" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict):
    keys = list(data.keys())
    if 'data' in data and isinstance(data['data'], (dict, list)):
        data = data['data']
    elif 'items' in data and isinstance(data['items'], list):
        data = data['items']
if isinstance(data, list):
    for i, item in enumerate(data[:3]):
        if isinstance(item, dict):
            print(f'  [{i}] ' + json.dumps({k: item[k] for k in list(item.keys())[:8] if k in item}, ensure_ascii=False))
        else:
            print(f'  [{i}] {item}')
    if len(data) > 3:
        print(f'  ... and {len(data)-3} more')
elif isinstance(data, dict):
    out = {k: data[k] for k in list(data.keys())[:12]}
    print('  ' + json.dumps(out, ensure_ascii=False, indent=2).replace('\n', '\n  '))
else:
    print('  ' + str(data))
" 2>/dev/null || echo "$1" | head -c 300
}

echo "=============================================="
echo "  家政服务匹配系统 - 完整业务流程演示"
echo "=============================================="
echo ""

echo "=== 步骤 0: 检查服务状态 ==="
echo "检查 $BASE_URL/housekeepers 是否可访问..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/housekeepers" | grep -q "200\|000"; then
  echo "  [OK] 服务可达"
else
  echo "  [WARN] 服务可能未启动，继续执行脚本..."
fi
echo ""

declare -a HK_IDS=()
declare -a HK_NAMES=("李阿姨" "王阿姨" "张阿姨" "赵阿姨" "刘阿姨" "孙阿姨")

echo "=============================================="
echo "=== 步骤 a: 创建 6 个阿姨 ==="
echo "=============================================="

create_housekeeper() {
  local name="$1" phone="$2" skills="$3" area="$4" exp="$5" salary="$6"
  echo ""
  echo "--- 创建阿姨: $name ---"
  local resp=$(curl -s -X POST "$BASE_URL/housekeepers" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"phone\": \"$phone\",
      \"skills\": \"$skills\",
      \"coverageArea\": \"$area\",
      \"experienceYears\": $exp,
      \"expectedMinSalary\": $salary,
      \"status\": \"ACTIVE\",
      \"hasCriminalRecordCheck\": true,
      \"hasHealthCertificate\": true
    }")
  local id=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)
  HK_IDS+=("$id")
  echo "  姓名: $name | 技能: $skills | 区域: $area"
  print_json "$resp"
}

create_housekeeper "李阿姨" "13800000001" "月嫂,育儿嫂" "朝阳区" 5 8000
create_housekeeper "王阿姨" "13800000002" "保姆,保洁" "海淀区" 3 6000
create_housekeeper "张阿姨" "13800000003" "月嫂,催乳师" "西城区" 8 10000
create_housekeeper "赵阿姨" "13800000004" "老人护理,烹饪" "丰台区" 6 7000
create_housekeeper "刘阿姨" "13800000005" "保洁,育儿" "东城区" 4 6500
create_housekeeper "孙阿姨" "13800000006" "月嫂,育儿嫂,催乳师" "朝阳区" 10 12000

HK_LI="${HK_IDS[0]}"
HK_WANG="${HK_IDS[1]}"
HK_ZHANG="${HK_IDS[2]}"
HK_ZHAO="${HK_IDS[3]}"
HK_LIU="${HK_IDS[4]}"
HK_SUN="${HK_IDS[5]}"

echo ""
echo "  阿姨ID汇总:"
for i in 0 1 2 3 4 5; do
  echo "    ${HK_NAMES[$i]}: ${HK_IDS[$i]}"
done
echo ""

declare -a INTAKE_IDS=()

echo "=============================================="
echo "=== 步骤 b: 创建 4 个客户需求（分配责任人+阻塞原因） ==="
echo "=============================================="

create_intake() {
  local cname="$1" cphone="$2" addr="$3" stype="$4" salary="$5" start="$6"
  local owner_role="$7" owner_id="$8" owner_name="$9"
  local block_reason="${10}"
  echo ""
  echo "--- 创建客户需求: $cname - $stype ---"
  local resp=$(curl -s -X POST "$BASE_URL/intakes" \
    -H "Content-Type: application/json" \
    -d "{
      \"customerName\": \"$cname\",
      \"customerPhone\": \"$cphone\",
      \"address\": \"$addr\",
      \"serviceType\": \"$stype\",
      \"salaryBudget\": $salary,
      \"startTime\": \"$start\",
      \"serviceScope\": \"每周5天，每天8小时\",
      \"requiredDaysPerWeek\": 5,
      \"hoursPerDay\": 8,
      \"remarks\": \"长期稳定优先\"
    }")
  local id=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)
  INTAKE_IDS+=("$id")
  echo "  客户: $cname | 服务: $stype | 预算: ${salary}元/月"
  print_json "$resp"

  if [ -n "$owner_role" ] && [ -n "$owner_id" ]; then
    echo ""
    echo "  -> 分配责任人: $owner_name ($owner_role)"
    local assign_resp=$(curl -s -X POST "$BASE_URL/intakes/$id/assign-owner" \
      -H "Content-Type: application/json" \
      -d "{
        \"ownerRole\": \"$owner_role\",
        \"ownerId\": \"$owner_id\",
        \"ownerName\": \"$owner_name\"
      }")
    print_json "$assign_resp"
  fi

  if [ -n "$block_reason" ] && [ "$block_reason" != "NONE" ]; then
    echo ""
    echo "  -> 设置阻塞原因: $block_reason"
    local block_resp=$(curl -s -X POST "$BASE_URL/intakes/$id/block-reason" \
      -H "Content-Type: application/json" \
      -d "{\"reason\": \"$block_reason\"}")
    print_json "$block_resp"
  fi
}

create_intake "陈女士" "13900000001" "朝阳区建国路88号" "月嫂" 9000 "2026-07-01" \
  "CUSTOMER_SERVICE" "cs-wang" "客服小王" "NONE"

create_intake "刘先生" "13900000002" "海淀区中关村大街" "保姆" 7000 "2026-07-05" \
  "CUSTOMER_SERVICE" "cs-li" "客服小李" "AWAITING_CUSTOMER_CLARIFICATION"

create_intake "周女士" "13900000003" "东城区朝阳门" "保洁" 4000 "2026-06-25" \
  "CUSTOMER_SERVICE" "cs-wang" "客服小王" "NONE"

create_intake "吴先生" "13900000004" "丰台区方庄" "老人护理" 7500 "2026-07-10" \
  "CUSTOMER_SERVICE" "cs-zhang" "客服小张" "CUSTOMER_UNREACHABLE"

INTAKE_CHEN="${INTAKE_IDS[0]}"
INTAKE_LIU="${INTAKE_IDS[1]}"
INTAKE_ZHOU="${INTAKE_IDS[2]}"
INTAKE_WU="${INTAKE_IDS[3]}"

echo ""
echo "  需求单ID汇总:"
echo "    陈女士(月嫂): $INTAKE_CHEN"
echo "    刘先生(保姆): $INTAKE_LIU"
echo "    周女士(保洁): $INTAKE_ZHOU"
echo "    吴先生(老人护理): $INTAKE_WU"
echo ""

echo "=============================================="
echo "=== 步骤 c: 运行匹配算法（对周女士的保洁需求） ==="
echo "=============================================="
echo ""
echo "--- 先启动匹配状态 ---"
curl -s -X POST "$BASE_URL/intakes/$INTAKE_ZHOU/start-matching" \
  -H "Content-Type: application/json" \
  -d '{"actorRole": "CUSTOMER_SERVICE", "actorId": "cs-wang", "actorName": "客服小王"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('  状态:', d.get('status'), '| 匹配轮次:', d.get('currentMatchingRound'))" 2>/dev/null || true

echo ""
echo "--- 执行匹配算法（取前3个候选） ---"
MATCH_RESP=$(curl -s -X POST "$BASE_URL/matchings/run" \
  -H "Content-Type: application/json" \
  -d "{
    \"intakeId\": \"$INTAKE_ZHOU\",
    \"topN\": 3,
    \"actor\": {\"role\": \"CUSTOMER_SERVICE\", \"id\": \"cs-wang\", \"name\": \"客服小王\"}
  }")
echo "  匹配结果:"
print_json "$MATCH_RESP"

echo ""
echo "--- 再运行一轮匹配（陈女士月嫂需求） ---"
curl -s -X POST "$BASE_URL/intakes/$INTAKE_CHEN/start-matching" \
  -H "Content-Type: application/json" \
  -d '{"actorRole": "CUSTOMER_SERVICE", "actorId": "cs-wang", "actorName": "客服小王"}' > /dev/null 2>&1 || true

curl -s -X POST "$BASE_URL/matchings/run" \
  -H "Content-Type: application/json" \
  -d "{
    \"intakeId\": \"$INTAKE_CHEN\",
    \"topN\": 3,
    \"actor\": {\"role\": \"CUSTOMER_SERVICE\", \"id\": \"cs-wang\", \"name\": \"客服小王\"}
  }" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  陈女士匹配完成，共尝试:', len(d) if isinstance(d,list) else d.get('totalAttempts','?'))" 2>/dev/null || echo "  匹配执行完成"
echo ""

echo "=============================================="
echo "=== 步骤 d: 查看匹配回看和失败原因分析 ==="
echo "=============================================="
echo ""
echo "--- 周女士需求 - 匹配回看（所有轮次快照和尝试） ---"
TRACE_RESP=$(curl -s "$BASE_URL/matchings/intake/$INTAKE_ZHOU/trace")
print_json "$TRACE_RESP"

echo ""
echo "--- 周女士需求 - 失败原因分析 ---"
FAIL_RESP=$(curl -s "$BASE_URL/matchings/intake/$INTAKE_ZHOU/failures")
print_json "$FAIL_RESP"
echo ""

declare -a ORDER_IDS=()

echo "=============================================="
echo "=== 步骤 e: 创建 2 个订单 ==="
echo "=============================================="

create_order() {
  local intake_id="$1" hk_id="$2" cname="$3" cphone="$4" addr="$5" stype="$6"
  local sstart="$7" salary="$8" owner_role="$9" owner_id="${10}" owner_name="${11}"
  echo ""
  echo "--- 创建订单: $cname - $stype ---"
  local resp=$(curl -s -X POST "$BASE_URL/orders" \
    -H "Content-Type: application/json" \
    -d "{
      \"intakeId\": \"$intake_id\",
      \"housekeeperId\": \"$hk_id\",
      \"customerName\": \"$cname\",
      \"customerPhone\": \"$cphone\",
      \"address\": \"$addr\",
      \"serviceType\": \"$stype\",
      \"scheduledStart\": \"$sstart\",
      \"salaryAmount\": $salary,
      \"ownerRole\": \"$owner_role\",
      \"ownerId\": \"$owner_id\",
      \"ownerName\": \"$owner_name\",
      \"serviceScope\": \"每周5天，每天8小时，包含基本家务\",
      \"remarks\": \"客户希望阿姨性格开朗\",
      \"actorRole\": \"$owner_role\",
      \"actorId\": \"$owner_id\",
      \"actorName\": \"$owner_name\"
    }")
  local id=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)
  ORDER_IDS+=("$id")
  local order_no=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('orderNo',''))" 2>/dev/null || true)
  local status=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || true)
  echo "  订单号: $order_no | 状态: $status | 金额: ${salary}分"
  print_json "$resp"
}

create_order "$INTAKE_CHEN" "$HK_LI" "陈女士" "13900000001" "朝阳区建国路88号" "月嫂" \
  "2026-07-01T08:00:00.000Z" 8000 "CUSTOMER_SERVICE" "cs-wang" "客服小王"

create_order "$INTAKE_ZHOU" "$HK_LIU" "周女士" "13900000003" "东城区朝阳门" "保洁" \
  "2026-06-25T09:00:00.000Z" 4000 "CUSTOMER_SERVICE" "cs-wang" "客服小王"

ORDER_1="${ORDER_IDS[0]}"
ORDER_2="${ORDER_IDS[1]}"

echo ""
echo "  订单ID汇总:"
echo "    陈女士-月嫂订单: $ORDER_1"
echo "    周女士-保洁订单: $ORDER_2"
echo ""

echo "=============================================="
echo "=== 步骤 f: 订单状态推进：确认、开始服务 ==="
echo "=============================================="
echo ""
echo "--- 订单1 (陈女士)：确认订单 ---"
RESP=$(curl -s -X POST "$BASE_URL/orders/$ORDER_1/confirm" \
  -H "Content-Type: application/json" \
  -d '{"actorRole": "CUSTOMER_SERVICE", "actorId": "cs-wang", "actorName": "客服小王"}')
echo "  状态变更为:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'), '| orderNo:', d.get('orderNo'))" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 订单1 (陈女士)：开始服务 ---"
RESP=$(curl -s -X POST "$BASE_URL/orders/$ORDER_1/start-service" \
  -H "Content-Type: application/json" \
  -d '{"actorRole": "CUSTOMER_SERVICE", "actorId": "cs-wang", "actorName": "客服小王"}')
echo "  状态变更为:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'))" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 订单2 (周女士)：确认订单 ---"
RESP=$(curl -s -X POST "$BASE_URL/orders/$ORDER_2/confirm" \
  -H "Content-Type: application/json" \
  -d '{"actorRole": "CUSTOMER_SERVICE", "actorId": "cs-wang", "actorName": "客服小王"}')
echo "  状态变更为:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'))" 2>/dev/null || print_json "$RESP"
echo ""

echo "=============================================="
echo "=== 步骤 g: 订单服务内容澄清 ==="
echo "=============================================="
echo ""
echo "--- 订单2 (周女士)：服务内容澄清 ---"
RESP=$(curl -s -X POST "$BASE_URL/orders/$ORDER_2/clarify-service" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_2\",
    \"serviceScope\": \"每周一至周五上午9点-12点，打扫卫生、做饭、洗衣服，不包含擦玻璃和油烟机深度清洁\",
    \"contactCountIncrement\": true,
    \"notes\": \"已与客户电话确认服务范围，客户明确表示不需要深度清洁服务\",
    \"actorRole\": \"CUSTOMER_SERVICE\",
    \"actorId\": \"cs-wang\",
    \"actorName\": \"客服小王\"
  }")
echo "  澄清结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    serviceClarificationStatus:', d.get('serviceClarificationStatus'), '| clarificationContactCount:', d.get('clarificationContactCount'))" 2>/dev/null || print_json "$RESP"
echo ""

echo "=============================================="
echo "=== 步骤 h: 订单上报爽约 ==="
echo "=============================================="
echo ""
echo "--- 订单1 (陈女士)：阿姨爽约 ---"
RESP=$(curl -s -X POST "$BASE_URL/orders/$ORDER_1/report-no-show" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_1\",
    \"noShowParty\": \"HOUSEKEEPER\",
    \"noShowReason\": \"阿姨临时有事无法到岗，且未提前24小时通知客户\",
    \"handlerRole\": \"CUSTOMER_SERVICE\",
    \"handlerId\": \"cs-wang\",
    \"handlerName\": \"客服小王\",
    \"actorRole\": \"CUSTOMER_SERVICE\",
    \"actorId\": \"cs-wang\",
    \"actorName\": \"客服小王\"
  }")
echo "  爽约上报结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'), '| noShowParty:', d.get('noShowParty'))" 2>/dev/null || print_json "$RESP"
echo ""

echo "=============================================="
echo "=== 步骤 i: 订单处理爽约 ==="
echo "=============================================="
echo ""
echo "--- 订单1 (陈女士)：处理爽约 - 安排重新匹配 ---"
RESP=$(curl -s -X POST "$BASE_URL/orders/$ORDER_1/handle-no-show" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_1\",
    \"resolutionType\": \"REMATCH\",
    \"resolution\": \"已向客户致歉，安排张阿姨作为替代人选，预计明日到岗，额外赠送一次免费深度保洁作为补偿\",
    \"assignOwnerRole\": \"CUSTOMER_SERVICE\",
    \"assignOwnerId\": \"cs-li\",
    \"assignOwnerName\": \"客服小李\",
    \"actorRole\": \"CUSTOMER_SERVICE\",
    \"actorId\": \"cs-wang\",
    \"actorName\": \"客服小王\"
  }")
echo "  爽约处理结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    resolutionType:', d.get('noShowResolutionType'), '| status:', d.get('status'))" 2>/dev/null || print_json "$RESP"
echo ""

declare -a REVIEW_IDS=()

echo "=============================================="
echo "=== 步骤 j: 创建差评 ==="
echo "=============================================="
echo ""
echo "--- 对订单2 (周女士-刘阿姨) 创建差评 ---"
RESP=$(curl -s -X POST "$BASE_URL/reviews" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_2\",
    \"customerName\": \"周女士\",
    \"housekeeperId\": \"$HK_LIU\",
    \"rating\": 2,
    \"content\": \"阿姨打扫不认真，厨房油污没有清理干净，多次提醒仍无改善，态度也比较冷淡，不推荐。\"
  }")
REVIEW_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)
REVIEW_IDS+=("$REVIEW_ID")
echo "  差评ID: $REVIEW_ID"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    rating:', d.get('rating'), '| status:', d.get('status'))" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 再创建一个差评 (订单1陈女士-李阿姨爽约差评) ---"
RESP=$(curl -s -X POST "$BASE_URL/reviews" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_1\",
    \"customerName\": \"陈女士\",
    \"housekeeperId\": \"$HK_LI\",
    \"rating\": 1,
    \"content\": \"阿姨第一天就爽约，完全没有职业素养，害得我临时找别人，非常生气，强烈要求换阿姨！\"
  }")
REVIEW_ID_2=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)
REVIEW_IDS+=("$REVIEW_ID_2")
echo "  差评ID: $REVIEW_ID_2"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    rating:', d.get('rating'), '| status:', d.get('status'))" 2>/dev/null || print_json "$RESP"
echo ""

echo "=============================================="
echo "=== 步骤 k: 分配质检主管给差评（带截止时间） ==="
echo "=============================================="
echo ""
echo "--- 差评1 (周女士)：分配质检主管李主管，48小时截止 ---"
RESP=$(curl -s -X POST "$BASE_URL/reviews/$REVIEW_ID/assign-quality" \
  -H "Content-Type: application/json" \
  -d "{
    \"assignedRole\": \"QUALITY_SUPERVISOR\",
    \"assignedId\": \"qs-li\",
    \"assignedName\": \"质检李主管\",
    \"deadlineHours\": 48
  }")
echo "  分配结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'), '| owner:', d.get('ownerName'), '| deadline:', d.get('deadline'))" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 差评2 (陈女士)：分配质检主管王主管，24小时截止 ---"
RESP=$(curl -s -X POST "$BASE_URL/reviews/$REVIEW_ID_2/assign-quality" \
  -H "Content-Type: application/json" \
  -d "{
    \"assignedRole\": \"QUALITY_SUPERVISOR\",
    \"assignedId\": \"qs-wang\",
    \"assignedName\": \"质检王主管\",
    \"deadlineHours\": 24
  }")
echo "  分配结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'), '| owner:', d.get('ownerName'), '| deadline:', d.get('deadline'))" 2>/dev/null || print_json "$RESP"
echo ""

echo "=============================================="
echo "=== 步骤 l: 质检跟进、升级、解决 ==="
echo "=============================================="
echo ""
echo "--- 差评1 (周女士)：质检跟进 ---"
RESP=$(curl -s -X POST "$BASE_URL/reviews/$REVIEW_ID/follow-up" \
  -H "Content-Type: application/json" \
  -d "{
    \"followUpNotes\": \"已联系客户周女士，客户确认服务质量问题属实。已联系刘阿姨进行约谈，阿姨承认因家中事情影响工作状态。\"
  }")
echo "  跟进结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'), '| followUpCount:', d.get('followUpCount'))" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 差评2 (陈女士)：质检跟进后升级处理 ---"
RESP=$(curl -s -X POST "$BASE_URL/reviews/$REVIEW_ID_2/follow-up" \
  -H "Content-Type: application/json" \
  -d "{
    \"followUpNotes\": \"已联系客户，客户情绪非常激动，要求公司高层介入并退还全部费用。阿姨李阿姨拒绝沟通。\"
  }")
echo "  跟进结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'))" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 差评2 (陈女士)：升级至管理层处理 ---"
RESP=$(curl -s -X POST "$BASE_URL/reviews/$REVIEW_ID_2/escalate" \
  -H "Content-Type: application/json" \
  -d "{
    \"reason\": \"客户情绪激动要求全额退款及赔偿，阿姨拒绝配合沟通，超出质检主管权限范围，需运营总监介入协调。\"
  }")
echo "  升级结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'), '| escalated:', d.get('escalatedAt'))" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 差评1 (周女士)：问题解决 ---"
RESP=$(curl -s -X POST "$BASE_URL/reviews/$REVIEW_ID/resolve" \
  -H "Content-Type: application/json" \
  -d "{
    \"resolution\": \"与客户达成一致：刘阿姨向客户诚恳道歉，公司免费安排一次专业深度保洁服务，并为客户更换一名经验更丰富的王阿姨继续服务。客户接受方案并表示愿意撤销差评。\"
  }")
echo "  解决结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'), '| resolvedAt:', d.get('resolvedAt'))" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 差评2 (陈女士)：升级后解决 ---"
RESP=$(curl -s -X POST "$BASE_URL/reviews/$REVIEW_ID_2/resolve" \
  -H "Content-Type: application/json" \
  -d "{
    \"resolution\": \"运营总监介入后达成方案：1)全额退还当月服务费用8000元；2)免费安排孙阿姨（金牌月嫂）接替服务一个月；3)李阿姨被记过一次，扣除当月奖金500元。客户对方案满意。\"
  }")
echo "  解决结果:"
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'), '| resolvedAt:', d.get('resolvedAt'))" 2>/dev/null || print_json "$RESP"
echo ""

echo "=============================================="
echo "=== 步骤 m: 仪表盘三大问题查询 ==="
echo "=============================================="
echo ""
echo "--- 问题1：谁在处理？（责任人工作汇总） ---"
echo "  GET /api/dashboard/owner-summary"
RESP=$(curl -s "$BASE_URL/dashboard/owner-summary")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('  统计时间:', d.get('generatedAt','')[:19])
ta = d.get('totalActive', {})
print(f'  活跃总数: Intake={ta.get(\"intakes\",0)}, Order={ta.get(\"orders\",0)}, Review={ta.get(\"reviews\",0)}')
br = d.get('byRole', {})
for role_key, role_label in [('customerService','客服'), ('housekeepers','家政员'), ('qualitySupervisors','质检主管')]:
    r = br.get(role_key, {})
    print(f'  [{role_label}] 总数: {r.get(\"total\",0)}')
    for owner in r.get('byOwner', [])[:3] if isinstance(r.get('byOwner',[]), list) else []:
        pass
    bo = r.get('byOwner', {})
    if isinstance(bo, dict):
        for oid, odata in list(bo.items())[:3]:
            print(f'    - {odata.get(\"ownerName\",\"?\")}: Intake={odata.get(\"intakes\",0)}, Order={odata.get(\"orders\",0)}, Review={odata.get(\"reviews\",0)}')
" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 问题2：卡在哪里？（卡住的Intake列表） ---"
echo "  GET /api/dashboard/blocked-intakes"
RESP=$(curl -s "$BASE_URL/dashboard/blocked-intakes")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('  统计时间:', d.get('generatedAt','')[:19])
print(f'  卡住总数: {d.get(\"total\",0)} | 平均卡住: {d.get(\"avgStuckHours\",0)}小时 | 最长: {d.get(\"maxStuckHours\",0)}小时')
bsl = d.get('byStuckLevel', {})
print(f'  卡住分级: 严重(>72h)={bsl.get(\"critical\",0)}, 警告(24-72h)={bsl.get(\"warning\",0)}, 正常(<24h)={bsl.get(\"normal\",0)}')
print('  按阻塞原因:')
br = d.get('byReason', {})
for rkey, rdata in br.items():
    print(f'    - {rdata.get(\"reasonText\",rkey)}: {rdata.get(\"count\",0)}单 (平均{rdata.get(\"avgStuckHours\",0)}h)')
print('  卡住明细(前3):')
for item in d.get('list', [])[:3]:
    print(f'    * {item.get(\"customerName\",\"\")}({item.get(\"serviceType\",\"\")}): {item.get(\"blockReasonText\",\"\")} - 已卡{item.get(\"stuckHours\",0)}h, 责任人:{item.get(\"ownerName\",\"\")}')
" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 问题3：匹配为什么没完成？（匹配失败原因分析） ---"
echo "  GET /api/dashboard/matching-block-reasons"
RESP=$(curl -s "$BASE_URL/dashboard/matching-block-reasons")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  涉及Intake数: {d.get(\"totalIntakes\",0)} | 总尝试: {d.get(\"totalAttempts\",0)} | 成功: {d.get(\"totalAccepted\",0)} | 成功率: {d.get(\"overallSuccessRate\",0)*100:.1f}%')
print('  TOP失败原因:')
for r in d.get('topReasons', [])[:5]:
    print(f'    - {r.get(\"reasonText\",r.get(\"reason\",\"\"))}: {r.get(\"count\",0)}次 ({r.get(\"percentage\",0)*100:.1f}%)')
print('  各轮次情况:')
for rd in d.get('byRound', [])[:3]:
    print(f'    * 第{rd.get(\"round\",0)}轮: 尝试{rd.get(\"totalAttempts\",0)}次, 成功{rd.get(\"accepted\",0)}次, 成功率{rd.get(\"successRate\",0)*100:.1f}%')
" 2>/dev/null || print_json "$RESP"

echo ""
echo "--- 针对周女士需求单独分析匹配失败原因 ---"
echo "  GET /api/dashboard/matching-block-reasons/$INTAKE_ZHOU"
RESP=$(curl -s "$BASE_URL/dashboard/matching-block-reasons/$INTAKE_ZHOU")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  客户: {d.get(\"customerName\",\"\")} | 总尝试: {d.get(\"totalAttempts\",0)} | 成功: {d.get(\"totalAccepted\",0)}')
print('  TOP失败原因:')
for r in d.get('topReasons', [])[:5]:
    print(f'    - {r.get(\"reasonText\",r.get(\"reason\",\"\"))}: {r.get(\"count\",0)}次 ({r.get(\"percentage\",0)*100:.1f}%)')
" 2>/dev/null || print_json "$RESP"
echo ""

echo "=============================================="
echo "=== 步骤 n: 仪表盘评价逾期汇总 ==="
echo "=============================================="
echo ""
echo "--- 综合统计总览（含评价逾期汇总） ---"
echo "  GET /api/dashboard/overview"
RESP=$(curl -s "$BASE_URL/dashboard/overview")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('  统计时间:', d.get('generatedAt','')[:19])
s = d.get('stats', {})
it = s.get('intakes', {})
print(f'  [需求Intake] 总:{it.get(\"total\",0)} | 创建中:{it.get(\"created\",0)} | 澄清中:{it.get(\"clarifying\",0)} | 匹配中:{it.get(\"matching\",0)} | 已卡住:{it.get(\"blocked\",0)}')
od = s.get('orders', {})
print(f'  [订单Order] 总:{od.get(\"total\",0)} | 待确认:{od.get(\"scheduled\",0)} | 已确认:{od.get(\"confirmed\",0)} | 服务中:{od.get(\"inService\",0)} | 爽约:{od.get(\"noShow\",0)} | 已完成:{od.get(\"completed\",0)}')
rv = s.get('reviews', {})
print(f'  [评价Review] 总:{rv.get(\"total\",0)} | 平均分:{rv.get(\"avgRating\",0)} | 待分配:{rv.get(\"pendingAssignment\",0)} | 质检中:{rv.get(\"qualityInProgress\",0)} | 已升级:{rv.get(\"qualityEscalated\",0)} | 已解决:{rv.get(\"resolved\",0)}')
print(f'  [评价逾期] 逾期数: {rv.get(\"overdue\",0)} | 平均逾期时长: {rv.get(\"avgOverdueHours\",0)}小时')
print(f'  [评价按责任人]')
for o in rv.get('byOwner', [])[:5]:
    print(f'    - {o.get(\"name\",\"\")}: {o.get(\"count\",0)}条待处理差评')
mg = s.get('matching', {})
print(f'  [匹配Matching] 总尝试:{mg.get(\"totalAttempts\",0)} | 成功:{mg.get(\"accepted\",0)} | 成功率:{mg.get(\"successRate\",0)*100:.1f}% | 平均轮次:{mg.get(\"avgRoundsPerIntake\",0)}')
ow = s.get('owners', {})
print(f'  [活跃责任人] 客服:{ow.get(\"customerService\",0)}人 | 家政员:{ow.get(\"housekeepers\",0)}人 | 质检主管:{ow.get(\"qualitySupervisors\",0)}人')
" 2>/dev/null || print_json "$RESP"
echo ""

echo "=============================================="
echo "  演示完成 - 总结"
echo "=============================================="
echo ""
echo "本次完整业务流程演示覆盖以下环节："
echo ""
echo "  【a. 阿姨档案】"
echo "    - 创建了6位不同技能、不同区域的阿姨档案（李阿姨、王阿姨、张阿姨、赵阿姨、刘阿姨、孙阿姨）"
echo ""
echo "  【b. 客户需求】"
echo "    - 创建了4个客户需求：陈女士(月嫂)、刘先生(保姆)、周女士(保洁)、吴先生(老人护理)"
echo "    - 每个需求都分配了客服责任人"
echo "    - 其中2个设置了阻塞原因：等待客户澄清、客户联系不上"
echo ""
echo "  【c. 匹配算法】"
echo "    - 对周女士的保洁需求和陈女士的月嫂需求分别执行了匹配算法"
echo ""
echo "  【d. 匹配回看】"
echo "    - 查看了匹配所有轮次的快照和尝试记录"
echo "    - 分析了匹配失败的具体原因"
echo ""
echo "  【e. 订单创建】"
echo "    - 创建了2个订单：陈女士-李阿姨(月嫂)、周女士-刘阿姨(保洁)"
echo ""
echo "  【f. 订单推进】"
echo "    - 订单1：确认 → 开始服务"
echo "    - 订单2：确认"
echo ""
echo "  【g. 服务澄清】"
echo "    - 对周女士的保洁订单进行了服务范围澄清，记录了联系次数和沟通内容"
echo ""
echo "  【h. 爽约上报】"
echo "    - 订单1上报阿姨李阿姨爽约，记录爽约原因"
echo ""
echo "  【i. 爽约处理】"
echo "    - 对爽约进行处理，方案为重新匹配，转交给客服小李跟进"
echo ""
echo "  【j. 创建差评】"
echo "    - 周女士对刘阿姨打2星差评（服务不认真）"
echo "    - 陈女士对李阿姨打1星差评（爽约）"
echo ""
echo "  【k. 分配质检】"
echo "    - 差评1分配给李主管，48小时截止"
echo "    - 差评2分配给王主管，24小时截止"
echo ""
echo "  【l. 质检流程】"
echo "    - 差评1：跟进 → 解决（补偿方案：道歉+免费深度保洁+换人）"
echo "    - 差评2：跟进 → 升级（客户情绪激动）→ 解决（全额退款+金牌月嫂+阿姨处罚）"
echo ""
echo "  【m. 仪表盘三大问题】"
echo "    - 谁在处理？：按角色分组展示客服、家政员、质检主管的工作负载"
echo "    - 卡在哪里？：展示卡住的需求、阻塞原因、卡住时长分级"
echo "    - 匹配为什么没完成？：全局和单个Intake的匹配失败原因TOP分析"
echo ""
echo "  【n. 评价逾期汇总】"
echo "    - 综合总览：Intake/Order/Review/匹配统计"
echo "    - 评价逾期：逾期数量、平均逾期时长、按责任人汇总待处理差评"
echo ""
echo "=============================================="
echo "  脚本执行完毕"
echo "=============================================="
