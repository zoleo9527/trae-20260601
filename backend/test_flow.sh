#!/bin/bash
BASE_URL="http://localhost:3001"
ADMIN_ID="8ebe1615dede4a75b57d600c"
ADMISSION_ID="013bdfc6eb5c49b191d62941"
COACH_ID="a5e6ec1ea1954f43bf41c51f"
EXAM_ID="ec7d0fd96daa47fcb26fdf32"
ZHOU_STUDENT_ID="e08873270154491b9fb74e7c"
ZHOU_BOOKING_ID="299b66717a0140fabf349336"
WANG_BOOKING_ID="4eb52b320fe142f58cda3622"
EXAM_SESSION_ID="bdfd8eed90624ed1a4a76612"

echo "========================================"
echo "  考试预约完整流程测试"
echo "========================================"

echo ""
echo "=== 1. 获取待审核考试预约列表 ==="
curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-bookings?status=pending&limit=5" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    print(f'共 {d[\"data\"][\"total\"]} 条待审核')
    for i, b in enumerate(d['data']['list'][:3]):
        print(f'  {i+1}. {b[\"student_name\"]} | 科目{b[\"subject\"]} | ID: {b[\"id\"]}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 2. 审核通过 周小明 科目1 ==="
curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" -d '{}' \
  "$BASE_URL/api/exam-bookings/$ZHOU_BOOKING_ID/approve" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    b = d['data']
    print(f'✅ 审核通过: {b[\"student_name\"]} 科目{b[\"subject\"]}')
    print(f'   状态: {b[\"status_name\"]} | 审核人: {b[\"approve_by_name\"]}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 3. 获取可预约考试场次 ==="
curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/exam-sessions/available?subject=1" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    for i, s in enumerate(d['data'][:2]):
        print(f'  {i+1}. ID: {s[\"id\"]} | {s[\"exam_date\"]} {s[\"exam_time\"]} | {s[\"exam_location\"]} | 剩余名额: {s[\"total_quota\"] - s[\"booked_count\"]}/{s[\"total_quota\"]}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 4. 预约场次（周小明 科目1） ==="
curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" \
  -d "{\"exam_session_id\": \"$EXAM_SESSION_ID\"}" \
  "$BASE_URL/api/exam-bookings/$ZHOU_BOOKING_ID/book-session" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    b = d['data']
    print(f'✅ 预约成功: {b[\"student_name\"]} 科目{b[\"subject\"]}')
    print(f'   状态: {b[\"status_name\"]} | 场次: {b[\"exam_date\"]} {b[\"exam_time\"]}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 5. 录入成绩（未通过，自动创建补考） ==="
curl -s -X POST -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  -H "Content-Type: application/json" \
  -d '{"result": "failed", "score": 58, "exam_result": "未通过"}' \
  "$BASE_URL/api/exam-bookings/$ZHOU_BOOKING_ID/record-result" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    b = d['data']
    print(f'✅ 成绩录入: {b[\"student_name\"]} 科目{b[\"subject\"]}')
    print(f'   状态: {b[\"status_name\"]} | 分数: {b[\"exam_score\"]}')
    print(f'   自动流转: 已创建补考记录并通知招生顾问')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 6. 验证补考记录已自动创建 ==="
curl -s -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  "$BASE_URL/api/makeup-exams?student_id=$ZHOU_STUDENT_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    for i, m in enumerate(d['data']['list']):
        print(f'  {i+1}. {m[\"student_name\"]} | 科目{m[\"subject\"]} | 状态: {m[\"status_name\"]} | 补考费: ¥{m[\"makeup_fee\"]}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 7. 首页优先级展示（考试专员视角） ==="
curl -s -H "X-User-Id: $EXAM_ID" -H "X-User-Role: exam_specialist" \
  "$BASE_URL/api/dashboard" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success'):
    data = d['data']
    print(f'用户: {data[\"user\"][\"name\"]} ({data[\"user\"][\"role_name\"]})')
    print(f'待办事项: {len(data[\"todos\"])} 条')
    print(f'优先级项: {len(data[\"priorityItems\"])} 条')
    print(f'卡住项: {len(data[\"stuckItems\"])} 条')
    print('--- 前3个优先级项 ---')
    for i, item in enumerate(data['priorityItems'][:3]):
        print(f'  {i+1}. [{item[\"priority\"]}] {item[\"title\"]}')
else:
    print(json.dumps(d, indent=2, ensure_ascii=False))
"

echo ""
echo "=== 8. 权限测试：招生顾问尝试审核考试预约（应该被拒绝） ==="
curl -s -X POST -H "X-User-Id: $ADMISSION_ID" -H "X-User-Role: admission_consultant" \
  -H "Content-Type: application/json" -d '{}' \
  "$BASE_URL/api/exam-bookings/$WANG_BOOKING_ID/approve" | python3 -c "
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
echo "  测试完成"
echo "========================================"
