#!/bin/bash
BASE_URL="http://localhost:3001"

echo "========================================"
echo "  补考链路修复验证测试"
echo "========================================"

echo ""
echo "=== 加载测试数据 ==="
ADMIN_ID="1620ef9263704558a48c40bf"
ADMISSION_ID="7df8308c4aac42ff831a072a"
EXAM_ID="38361c12b4ca4ecaaeaecbb6"

# 获取补考ID和考试场次ID
MAKEUP_PENDING_PAYMENT=$(curl -s -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  "$BASE_URL/api/makeup-exams?status=pending_payment" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data']['list'][0]['id'])
")
MAKEUP_PENDING_BOOKING=$(curl -s -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  "$BASE_URL/api/makeup-exams?status=pending_booking" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data']['list'][0]['id'])
")
EXAM_SESSION_ID=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/available?subject=1" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data'][0]['id'])
")
EXAM_SESSION_SUBJECT2=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/available?subject=2" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data'][0]['id'])
")

echo "待缴费补考ID: $MAKEUP_PENDING_PAYMENT"
echo "待约考补考ID: $MAKEUP_PENDING_BOOKING"
echo "科目1场次ID: $EXAM_SESSION_ID"
echo "科目2场次ID: $EXAM_SESSION_SUBJECT2"

echo ""
echo "========================================"
echo "  修复1: 登记补考费按实收金额更新"
echo "========================================"

echo ""
echo "=== 1.1 部分缴费(50/100) - 不应推进到待约考 ==="
BEFORE_STATUS=$(curl -s -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_PAYMENT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data']['status'])
")
echo "缴费前状态: $BEFORE_STATUS"

curl -s -X POST -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "payment_method": "微信"}' \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_PAYMENT/record-payment" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    m = d['data']
    print(f'✅ 部分缴费成功')
    print(f'   补考状态: {m[\"status_name\"]} (期望: 待缴费)')
    print(f'   是否已缴清: {m[\"fee_paid\"]} (期望: False)')
    print(f'   费用记录状态: {m[\"feeRecord\"][\"status\"]} (期望: partial)')
    print(f'   已缴金额: ¥{m[\"feeRecord\"][\"paid_amount\"]}/¥{m[\"feeRecord\"][\"amount\"]}')
    status_ok = m['status'] == 'pending_payment'
    paid_ok = m['fee_paid'] == False
    fee_ok = m['feeRecord']['status'] == 'partial'
    print(f'   验证结果: {\"PASS ✅\" if status_ok and paid_ok and fee_ok else \"FAIL ❌\"}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 1.2 缴清剩余费用(50/100) - 应推进到待约考 ==="
curl -s -X POST -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "payment_method": "微信"}' \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_PAYMENT/record-payment" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    m = d['data']
    print(f'✅ 缴清成功')
    print(f'   补考状态: {m[\"status_name\"]} (期望: 待约考)')
    print(f'   是否已缴清: {m[\"fee_paid\"]} (期望: True)')
    print(f'   费用记录状态: {m[\"feeRecord\"][\"status\"]} (期望: paid)')
    print(f'   已缴金额: ¥{m[\"feeRecord\"][\"paid_amount\"]}/¥{m[\"feeRecord\"][\"amount\"]}')
    status_ok = m['status'] == 'pending_booking'
    paid_ok = m['fee_paid'] == True
    fee_ok = m['feeRecord']['status'] == 'paid'
    print(f'   验证结果: {\"PASS ✅\" if status_ok and paid_ok and fee_ok else \"FAIL ❌\"}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 1.3 验证时间线回写 ==="
curl -s -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_PAYMENT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    m = d['data']
    print(f'时间线记录数: {len(m[\"timeline\"])}')
    for t in m['timeline']:
        print(f'  {t[\"created_at\"]} - {t[\"operator_name\"]}: {t[\"detail\"]}')
    print(f'时间线验证: {\"PASS ✅\" if len(m[\"timeline\"]) >= 2 else \"FAIL ❌\"}')
"

echo ""
echo "========================================"
echo "  修复2: 预约补考同步推进状态和名额"
echo "========================================"

echo ""
echo "=== 2.1 获取场次当前预约人数 ==="
SESSION_BEFORE=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/$EXAM_SESSION_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['data']
print(f'{s[\"booked_count\"]}/{s[\"total_quota\"]}')
")
echo "预约前: $SESSION_BEFORE"

echo ""
echo "=== 2.2 预约补考 ==="
curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" \
  -d "{\"exam_session_id\": \"$EXAM_SESSION_ID\"}" \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_PAYMENT/book-exam" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    m = d['data']
    print(f'✅ 预约补考成功')
    print(f'   补考状态: {m[\"status_name\"]} (期望: 已约考)')
    print(f'   关联预约ID: {m[\"new_booking_id\"]}')
    print(f'   关联预约状态: {m[\"new_booking_status\"]} (期望: booked)')
    status_ok = m['status'] == 'booked'
    booking_ok = m['new_booking_status'] == 'booked'
    print(f'   验证结果: {\"PASS ✅\" if status_ok and booking_ok else \"FAIL ❌\"}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 2.3 验证场次名额已扣减 ==="
SESSION_AFTER=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/$EXAM_SESSION_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['data']
print(f'{s[\"booked_count\"]}/{s[\"total_quota\"]}')
")
echo "预约后: $SESSION_AFTER"
python3 -c "
before = int('$SESSION_BEFORE'.split('/')[0])
after = int('$SESSION_AFTER'.split('/')[0])
print(f'名额变化: {before} -> {after} (期望: +1)')
print(f'验证结果: {\"PASS ✅\" if after == before + 1 else \"FAIL ❌\"}')
"

echo ""
echo "========================================"
echo "  修复3: 完成/取消补考状态同步"
echo "========================================"

echo ""
echo "=== 3.1 先录入补考考试成绩（通过） ==="
NEW_BOOKING_ID=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_PAYMENT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data']['new_booking_id'])
")
echo "新预约ID: $NEW_BOOKING_ID"

curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" \
  -d '{"result": "passed", "score": 95}' \
  "$BASE_URL/api/exam-bookings/$NEW_BOOKING_ID/record-result" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    b = d['data']
    print(f'✅ 成绩录入成功')
    print(f'   状态: {b[\"status_name\"]} | 分数: {b[\"exam_score\"]}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 3.2 完成补考（考试专员权限验证） ==="
curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" -d '{}' \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_PAYMENT/complete" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    m = d['data']
    print(f'✅ 完成补考成功')
    print(f'   补考状态: {m[\"status_name\"]} (期望: 已完成)')
    print(f'   费用状态: {m[\"feeRecord\"][\"status\"]} (期望: paid)')
    print(f'   关联预约状态: {m[\"new_booking_status\"]} (期望: passed)')
    status_ok = m['status'] == 'completed'
    fee_ok = m['feeRecord']['status'] == 'paid'
    booking_ok = m['new_booking_status'] == 'passed'
    print(f'   验证结果: {\"PASS ✅\" if status_ok and fee_ok and booking_ok else \"FAIL ❌\"}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 3.3 验证时间线完整 ==="
curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_PAYMENT/review" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    r = d['data']
    print(f'补考回看 - {r[\"makeup\"][\"student_name\"]} 科目{r[\"makeup\"][\"subject\"]}')
    print(f'费用状态一致: {r[\"makeup\"][\"fee_paid\"] == (r[\"makeup\"][\"feeRecord\"][\"status\"] == \"paid\")}')
    print(f'约考状态一致: {r[\"makeup\"][\"status\"] == \"completed\" and r[\"makeup\"][\"new_booking_status\"] == \"passed\"}')
    print(f'时间线记录数: {len(r[\"makeup\"][\"timeline\"])}')
    print('--- 完整时间线 ---')
    for t in r['makeup']['timeline']:
        print(f'  {t[\"created_at\"]} | {t[\"operator_name\"]}({t[\"operator_role\"]}) | {t[\"action\"]}')
        print(f'    {t[\"detail\"]}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 3.4 测试取消补考（释放名额） ==="
SESSION_BEFORE_CANCEL=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/$EXAM_SESSION_SUBJECT2" | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['data']
print(f'{s[\"booked_count\"]}/{s[\"total_quota\"]}')
")
echo "取消前场次名额: $SESSION_BEFORE_CANCEL"

echo "先预约另一个补考用于取消测试..."
curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" \
  -d "{\"exam_session_id\": \"$EXAM_SESSION_SUBJECT2\"}" \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_BOOKING/book-exam" > /dev/null 2>&1

SESSION_AFTER_BOOK=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/$EXAM_SESSION_SUBJECT2" | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['data']
print(f'{s[\"booked_count\"]}/{s[\"total_quota\"]}')
")
echo "预约后场次名额: $SESSION_AFTER_BOOK"

echo "取消补考..."
curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" \
  -d '{"reason": "学员个人原因取消"}' \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_BOOKING/cancel" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    m = d['data']
    print(f'✅ 取消补考成功')
    print(f'   补考状态: {m[\"status_name\"]} (期望: 已取消)')
    status_ok = m['status'] == 'cancelled'
    print(f'   验证结果: {\"PASS ✅\" if status_ok else \"FAIL ❌\"}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

SESSION_AFTER_CANCEL=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/$EXAM_SESSION_SUBJECT2" | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['data']
print(f'{s[\"booked_count\"]}/{s[\"total_quota\"]}')
")
echo "取消后场次名额: $SESSION_AFTER_CANCEL"
python3 -c "
before = int('$SESSION_AFTER_BOOK'.split('/')[0])
after = int('$SESSION_AFTER_CANCEL'.split('/')[0])
print(f'名额变化: {before} -> {after} (期望: -1)')
print(f'名额释放验证: {\"PASS ✅\" if after == before - 1 else \"FAIL ❌\"}')
"

echo ""
echo "=== 3.5 验证权限控制：招生顾问不能完成/取消补考 ==="
echo "测试招生顾问完成补考..."
curl -s -X POST -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  -H "Content-Type: application/json" -d '{}' \
  "$BASE_URL/api/makeup-exams/$MAKEUP_PENDING_PAYMENT/complete" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if not d.get('success'):
    e = d['error']
    print(f'❌ 正确拒绝: [{e[\"code\"]}] {e[\"message\"]}')
else:
    print('⚠️  权限控制失效！')
"

echo ""
echo "========================================"
echo "  所有测试完成"
echo "========================================"
