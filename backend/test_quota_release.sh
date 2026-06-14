#!/bin/bash
BASE_URL="http://localhost:3001"
ADMISSION_ID="3be3eab2ef2847acaf8ba8a9"
EXAM_ID="f5166c32c75448db90e3eea9"

echo "========================================"
echo "  取消补考名额释放测试"
echo "========================================"

# 获取待约考补考（科目2）
MAKEUP_ID=$(curl -s -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  "$BASE_URL/api/makeup-exams?status=pending_booking&subject=2" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data']['list'][0]['id'])
")

# 获取科目2场次
SESSION_ID=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/available?subject=2" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data'][0]['id'])
")

echo "补考ID: $MAKEUP_ID"
echo "场次ID: $SESSION_ID"
echo ""

# 1. 获取预约前的名额
BEFORE=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/$SESSION_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['data']
print(f'{s[\"booked_count\"]}/{s[\"total_quota\"]}')
")
echo "步骤1 - 预约前名额: $BEFORE"

# 2. 预约补考
echo ""
echo "步骤2 - 预约补考..."
curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" \
  -d "{\"exam_session_id\": \"$SESSION_ID\"}" \
  "$BASE_URL/api/makeup-exams/$MAKEUP_ID/book-exam" > /dev/null 2>&1

# 3. 获取预约后的名额
AFTER_BOOK=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/$SESSION_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['data']
print(f'{s[\"booked_count\"]}/{s[\"total_quota\"]}')
")
echo "步骤3 - 预约后名额: $AFTER_BOOK"

# 验证名额已增加
BEFORE_COUNT=$(echo $BEFORE | cut -d'/' -f1)
AFTER_BOOK_COUNT=$(echo $AFTER_BOOK | cut -d'/' -f1)
if [ "$AFTER_BOOK_COUNT" -eq "$((BEFORE_COUNT + 1))" ]; then
  echo "✅ 预约后名额正确增加 +1"
else
  echo "❌ 预约后名额未正确增加"
fi

# 4. 取消补考
echo ""
echo "步骤4 - 取消补考..."
curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" \
  -d '{"reason": "测试取消释放名额"}' \
  "$BASE_URL/api/makeup-exams/$MAKEUP_ID/cancel" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    m = d['data']
    print(f'✅ 取消成功: {m[\"status_name\"]}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

# 5. 获取取消后的名额
AFTER_CANCEL=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/$SESSION_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['data']
print(f'{s[\"booked_count\"]}/{s[\"total_quota\"]}')
")
echo ""
echo "步骤5 - 取消后名额: $AFTER_CANCEL"

# 验证名额已释放
AFTER_CANCEL_COUNT=$(echo $AFTER_CANCEL | cut -d'/' -f1)
if [ "$AFTER_CANCEL_COUNT" -eq "$BEFORE_COUNT" ]; then
  echo "✅ 取消后名额正确释放 -1，恢复到预约前水平"
else
  echo "❌ 取消后名额未正确释放，期望: $BEFORE_COUNT，实际: $AFTER_CANCEL_COUNT"
fi

# 6. 验证关联的考试预约也已取消
echo ""
echo "步骤6 - 验证关联考试预约状态..."
NEW_BOOKING_ID=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/makeup-exams/$MAKEUP_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data']['new_booking_id'] or 'None')
")
echo "关联预约ID: $NEW_BOOKING_ID"

if [ "$NEW_BOOKING_ID" != "None" ]; then
  BOOKING_STATUS=$(curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
    "$BASE_URL/api/exam-bookings/$NEW_BOOKING_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['data']['status_name'])
")
  echo "关联预约状态: $BOOKING_STATUS"
  if [ "$BOOKING_STATUS" == "已取消" ]; then
    echo "✅ 关联考试预约也已取消，状态一致"
  else
    echo "❌ 关联考试预约状态不一致"
  fi
fi

# 7. 验证时间线
echo ""
echo "步骤7 - 验证完整时间线..."
curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/makeup-exams/$MAKEUP_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    m = d['data']
    print(f'时间线记录数: {len(m[\"timeline\"])}')
    for t in m['timeline']:
        print(f'  {t[\"created_at\"]} | {t[\"operator_name\"]} | {t[\"action\"]}')
        print(f'    {t[\"detail\"]}')
    if len(m['timeline']) >= 3:
        print('✅ 时间线完整（缴费、预约、取消）')
    else:
        print('❌ 时间线不完整')
"

echo ""
echo "========================================"
echo "  测试完成"
echo "========================================"
