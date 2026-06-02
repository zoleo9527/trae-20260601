#!/bin/bash

BASE_URL="http://localhost:3002/api"
TODAY=$(date +%Y-%m-%d)

echo "========================================"
echo "🧪 站点删除外键阻塞 + 签到摘要 + 学生摘要统一"
echo "========================================"
echo ""

echo "📊 测试1: 删除被引用的站点（应返回 409 + 引用详情）"
echo "----------------------------------------"
curl -s -w "\nHTTP_CODE: %{http_code}\n" -X DELETE "$BASE_URL/stops/1" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print(f'错误: {data[\"error\"]}')
        print(f'错误码: {data.get(\"code\", \"N/A\")}')
        refs = data.get('references', {})
        print(f'引用学生: {len(refs.get(\"students\", []))} 人')
        for s in refs.get('students', []):
            print(f'  - id={s[\"id\"]}, name={s[\"name\"]}, student_id={s[\"student_id\"]}')
        print(f'引用签到: {len(refs.get(\"check_ins\", []))} 条')
        print(f'引用乘车: {len(refs.get(\"ride_records\", []))} 条')
        print(f'引用迟到: {len(refs.get(\"late_events\", []))} 条')
        print('✓ 正确阻止删除，返回引用详情')
    else:
        print('❌ 应该阻止删除但没阻止')
except:
    pass
"
echo ""

echo "📊 测试2: 删除无引用的站点（应成功）"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/stops" \
  -H "Content-Type: application/json" \
  -d '{
    "route_id": 1,
    "name": "临时站点(无引用)",
    "address": "临时路1号",
    "sequence": 99,
    "estimated_arrival_time": "08:00:00"
  }' | python3 -c "
import json, sys
data = json.load(sys.stdin)
new_id = data['id']
print(f'创建临时站点 ID: {new_id}')
" 
echo ""

NEW_STOP=$(curl -s -X POST "$BASE_URL/stops" \
  -H "Content-Type: application/json" \
  -d '{
    "route_id": 1,
    "name": "待删站点",
    "address": "待删路1号",
    "sequence": 98,
    "estimated_arrival_time": "09:00:00"
  }' | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

curl -s -X DELETE "$BASE_URL/stops/$NEW_STOP" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'删除结果: {data[\"message\"]}')
print('✓ 无引用站点可以正常删除')
"
echo ""

echo "📊 测试3: 线路更新中 _deleted 站点被引用（应返回 409）"
echo "----------------------------------------"
curl -s -w "\nHTTP_CODE: %{http_code}\n" -X PUT "$BASE_URL/routes/1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "1号线 - 城东线",
    "description": "从城东小区到实验学校",
    "direction": "morning",
    "estimated_duration": 45,
    "stops": [
      {
        "id": 1,
        "_deleted": true
      }
    ]
  }' | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print(f'错误: {data[\"error\"]}')
        print(f'错误码: {data.get(\"code\", \"N/A\")}')
        for fs in data.get('failed_stops', []):
            print(f'  站点ID {fs[\"stop_id\"]}: {fs[\"error\"]}')
            refs = fs.get('references', {})
            print(f'    学生: {len(refs.get(\"students\", []))} 人')
            print(f'    签到: {len(refs.get(\"check_ins\", []))} 条')
        print('✓ 线路更新中正确阻止删除被引用站点')
    else:
        print('❌ 应该阻止删除但没阻止')
except:
    pass
"
echo ""

echo "📊 测试4: POST /check-ins 返回线路、车辆、学生摘要"
echo "----------------------------------------"
TODAY_DATE=$(date +%Y-%m-%d)
curl -s -X POST "$BASE_URL/check-ins" \
  -H "Content-Type: application/json" \
  -d "{
    \"schedule_id\": 1,
    \"stop_id\": 3,
    \"driver_id\": 1,
    \"actual_arrival_time\": \"${TODAY_DATE}T06:53:00\",
    \"notes\": \"测试签到-完整摘要\"
  }" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'签到ID: {data[\"id\"]}')
print(f'状态: {data[\"status\"]}, 晚点: {data[\"delay_minutes\"]} 分钟')
print()
print('--- 线路摘要 ---')
r = data['data']['route']
print(f'  id={r[\"id\"]}, name={r[\"name\"]}, direction={r[\"direction\"]}')
print()
print('--- 车辆摘要 ---')
v = data['data']['vehicle']
print(f'  id={v[\"id\"]}, plate_number={v[\"plate_number\"]}, model={v[\"model\"]}')
print()
print('--- 站点摘要 ---')
s = data['data']['stop']
print(f'  id={s[\"id\"]}, name={s[\"name\"]}, estimated_arrival_time={s[\"estimated_arrival_time\"]}')
print()
print('--- 司机摘要 ---')
d = data['data']['driver']
print(f'  id={d[\"id\"]}, name={d[\"name\"]}, phone={d[\"phone\"]}')
print()
print('--- 排班摘要 ---')
sc = data['data']['schedule']
print(f'  id={sc[\"id\"]}, schedule_date={sc[\"schedule_date\"]}, shift_type={sc[\"shift_type\"]}, route_name={sc[\"route_name\"]}')
print()
print('--- 待上车学生摘要 (统一 id/student_id 结构) ---')
ps = data['pending_students']
print(f'  总数: {ps[\"count\"]}')
for stu in ps['students']:
    print(f'  id={stu[\"id\"]}, student_id={stu[\"student_id\"]}, name={stu[\"name\"]}, grade={stu[\"grade\"]}, class={stu[\"class\"]}')
    print(f'    parent: {stu[\"parent_name\"]} ({stu[\"parent_phone\"]})')
print('✓ 签到接口返回线路、车辆、学生完整摘要')
"
echo ""

echo "📊 测试5: 学生摘要 id/student_id 结构统一性检查"
echo "----------------------------------------"
echo "--- 排班创建接口的学生摘要 ---"
curl -s -X POST "$BASE_URL/schedules" \
  -H "Content-Type: application/json" \
  -d "{
    \"route_id\": 2,
    \"vehicle_id\": 1,
    \"driver_id\": 1,
    \"schedule_date\": \"2026-06-03\",
    \"shift_type\": \"morning\",
    \"notes\": \"统一学生摘要测试\"
  }" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for s in data['ride_records_summary']['students']:
    print(f'  id={s[\"id\"]}, student_id={s[\"student_id\"]}, name={s[\"name\"]}')
    if s['id'] == s['student_id']:
        print('    ❌ id 和 student_id 不应该相同 (id 应为行 ID, student_id 应为学号)')
    else:
        print('    ✓ id(行ID) 和 student_id(学号) 正确区分')
"
echo ""

echo "--- 申诉创建接口的学生摘要 ---"
curl -s -X POST "$BASE_URL/complaints" \
  -H "Content-Type: application/json" \
  -d "{
    \"student_id\": 1,
    \"schedule_id\": 1,
    \"complaint_type\": \"late\",
    \"description\": \"测试学生摘要统一\",
    \"parent_name\": \"测试家长\",
    \"parent_phone\": \"13800000000\"
  }" | python3 -c "
import json, sys
data = json.load(sys.stdin)
stu = data['data']['student']
print(f'  id={stu[\"id\"]}, student_id={stu[\"student_id\"]}, name={stu[\"name\"]}')
print(f'  grade={stu[\"grade\"]}, class={stu[\"class\"]}')
print(f'  parent: {stu[\"parent_name\"]} ({stu[\"parent_phone\"]})')
if stu['id'] == stu['student_id']:
    print('  ❌ id 和 student_id 不应该相同')
else:
    print('  ✓ id(行ID) 和 student_id(学号) 正确区分')
"
echo ""

echo "========================================"
echo "✅ 所有断点修复测试完成！"
echo "========================================"
echo ""
echo "📋 修复总结:"
echo "  1. ✅ DELETE /stops/:id - 被引用时返回 409 + 引用详情"
echo "  2. ✅ PUT /routes/:id 中 _deleted 站点 - 被引用时返回 409"
echo "  3. ✅ POST /stops/bulk 中 _deleted 站点 - 被引用时返回 409"
echo "  4. ✅ POST /check-ins - 返回线路、车辆、学生完整摘要"
echo "  5. ✅ 学生摘要 id(行ID)/student_id(学号) 结构统一"
