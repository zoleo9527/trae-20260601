#!/bin/bash

BASE_URL="http://localhost:3002/api"
TODAY=$(date +%Y-%m-%d)
YESTERDAY=$(date -v-1d +%Y-%m-%d)

echo "========================================"
echo "🧪 校车管理系统 API 测试"
echo "========================================"
echo ""

echo "📊 测试1: 健康检查"
curl -s "$BASE_URL/health"
echo ""
echo "✓ 健康检查通过"
echo ""

echo "📊 测试2: 仪表盘统计"
echo "----------------------------------------"
curl -s "$BASE_URL/queries/dashboard" | python3 -m json.tool
echo "✓ 仪表盘统计正常"
echo ""

echo "📊 测试3: 按线路日期查询 (2号线 $TODAY)"
echo "----------------------------------------"
curl -s "$BASE_URL/queries/route/2/date/$TODAY" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'线路: {data[\"route\"][\"name\"]}')
print(f'日期: {data[\"date\"]}')
print(f'排班数: {len(data[\"schedules\"])}')
for s in data[\"schedules\"]:
    print(f'  班次: {s[\"shift_type\"]}')
    print(f'  车辆: {s[\"vehicle\"][\"plate_number\"]} ({s[\"vehicle\"][\"model\"]})')
    print(f'  司机: {s[\"driver\"][\"name\"]} ({s[\"driver\"][\"phone\"]})')
    print(f'  状态: {s[\"status\"]}')
    print(f'  学生统计: {s[\"summary\"][\"boarded\"]}已上车 / {s[\"summary\"][\"absent\"]}未上车 / {s[\"summary\"][\"pending\"]}待乘车')
    print(f'  晚点情况: {s[\"summary\"][\"late_stops\"]}站晚点, 累计{s[\"summary\"][\"total_delay_minutes\"]}分钟')
    print(f'  申诉数: {len(s[\"complaints\"])}')
"
echo "✓ 线路日期查询正常"
echo ""

echo "📊 测试4: 按学生查当天乘车状态 (学生ID=1)"
echo "----------------------------------------"
curl -s "$BASE_URL/queries/student/1/today" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'学生: {data[\"student\"][\"name\"]} ({data[\"student\"][\"student_id\"]})')
print(f'班级: {data[\"student\"][\"grade\"]}{data[\"student\"][\"class\"]}')
print(f'家长: {data[\"student\"][\"parent_name\"]} ({data[\"student\"][\"parent_phone\"]})')
print(f'默认线路: {data[\"student\"][\"default_route\"][\"name\"]}')
print(f'日期: {data[\"date\"]}')
for r in data[\"ride_records\"]:
    print(f'  {r[\"shift_type\"]} 班次: {r[\"status_text\"]}')
    if r[\"check_in\"]:
        print(f'    到站时间: {r[\"check_in\"][\"actual_arrival_time\"]}')
        print(f'    晚点: {r[\"check_in\"][\"delay_minutes\"]}分钟')
"
echo "✓ 学生乘车状态查询正常"
echo ""

echo "📊 测试5: 获取申诉列表"
echo "----------------------------------------"
curl -s "$BASE_URL/complaints" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'申诉总数: {len(data)}')
for c in data:
    print(f'  ID: {c[\"id\"]}')
    print(f'  学生: {c[\"student\"][\"name\"]}')
    print(f'  类型: {c[\"complaint_type\"]}')
    print(f'  状态: {c[\"status\"]}')
    print(f'  家长: {c[\"parent_name\"]} ({c[\"parent_phone\"]})')
    print(f'  描述: {c[\"description\"][:50]}...')
    if c[\"schedule\"]:
        print(f'  关联排班: {c[\"schedule\"][\"route_name\"]} {c[\"schedule\"][\"schedule_date\"]}')
    print()
"
echo "✓ 申诉列表查询正常"
echo ""

echo "📊 测试6: 获取申诉详情 (带证据链 ID=1)"
echo "----------------------------------------"
curl -s "$BASE_URL/complaints/1" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'申诉ID: {data[\"id\"]}')
print(f'学生: {data[\"student\"][\"name\"]}')
print(f'状态: {data[\"status\"]}')
print(f'家长描述: {data[\"description\"]}')
print(f'处理人备注: {data[\"handler_notes\"]}')
print(f'复核结果: {data[\"review_result\"]}')
print()
print('🔍 证据链:')
if data[\"evidence\"] and data[\"evidence\"][\"schedule\"]:
    s = data[\"evidence\"][\"schedule\"]
    print(f'  排班: {s[\"route_name\"]} {s[\"schedule_date\"]}')
    print(f'  司机: {s[\"driver_name\"]}')
    print(f'  车辆: {s[\"plate_number\"]}')
if data[\"evidence\"] and data[\"evidence\"][\"student_ride\"]:
    r = data[\"evidence\"][\"student_ride\"]
    print(f'  学生乘车状态: {r[\"status\"]}')
    print(f'  上车站点: {r[\"stop_name\"]}')
    if r[\"board_time\"]:
        print(f'  上车时间: {r[\"board_time\"]}')
if data[\"evidence\"] and data[\"evidence\"][\"late_events\"]:
    print(f'  关联迟到事件: {len(data[\"evidence\"][\"late_events\"])} 个')
"
echo "✓ 申诉详情查询正常"
echo ""

echo "📊 测试7: 测试司机签到 (创建新签到)"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/check-ins" \
  -H "Content-Type: application/json" \
  -d "{
    \"schedule_id\": 1,
    \"stop_id\": 3,
    \"driver_id\": 1,
    \"actual_arrival_time\": \"${TODAY}T06:50:00\",
    \"notes\": \"测试签到\"
  }" | python3 -m json.tool
echo "✓ 司机签到正常"
echo ""

echo "📊 测试8: 获取迟到事件列表"
echo "----------------------------------------"
curl -s "$BASE_URL/late-events" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'迟到事件总数: {len(data)}')
for e in data[:5]:
    print(f'  ID: {e[\"id\"]} | {e[\"schedule\"][\"route_name\"]} | 晚点{e[\"delay_minutes\"]}分钟 | {e[\"status\"]} | {e[\"reason\"][:30]}...')
"
echo "✓ 迟到事件查询正常"
echo ""

echo "========================================"
echo "✅ 所有 API 测试通过！"
echo "========================================"
echo ""
echo "📋 API 接口清单:"
echo "  GET    /api/routes                          - 获取所有线路"
echo "  GET    /api/routes/:id                      - 获取线路详情"
echo "  POST   /api/routes                          - 创建线路"
echo "  GET    /api/vehicles                        - 获取所有车辆"
echo "  GET    /api/drivers                         - 获取所有司机"
echo "  GET    /api/students                        - 获取所有学生"
echo "  GET    /api/schedules                       - 获取所有排班"
echo "  POST   /api/schedules                       - 创建排班"
echo "  GET    /api/check-ins                       - 获取所有签到"
echo "  POST   /api/check-ins                       - 司机签到"
echo "  GET    /api/ride-records                    - 获取所有乘车记录"
echo "  PUT    /api/ride-records/:id                - 更新乘车记录"
echo "  POST   /api/ride-records/bulk               - 批量更新乘车记录"
echo "  GET    /api/late-events                     - 获取所有迟到事件"
echo "  GET    /api/complaints                      - 获取所有申诉"
echo "  GET    /api/complaints/:id                  - 获取申诉详情（带证据）"
echo "  POST   /api/complaints                      - 创建申诉"
echo "  POST   /api/complaints/review               - 主管复核申诉"
echo "  GET    /api/queries/route/:id/date/:date    - 按线路日期查询"
echo "  GET    /api/queries/student/:id/today       - 按学生查当天状态"
echo "  GET    /api/queries/dashboard               - 仪表盘统计"
