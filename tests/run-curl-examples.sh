#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "========================================"
echo "标识制作厂工作流系统 - API 请求示例"
echo "========================================"
echo ""

echo "【1】获取所有用户"
curl -s "$BASE_URL/users" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/users"
echo ""
echo "----------------------------------------"
echo ""

echo "【2】获取所有项目（含不同状态）"
curl -s -H "X-User-Id: USER_001" "$BASE_URL/projects" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/projects"
echo ""
echo "----------------------------------------"
echo ""

echo "【3】查看项目 PRJ_202606001 详情（含操作时间线）"
curl -s -H "X-User-Id: USER_001" "$BASE_URL/projects/PRJ_202606001" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/projects/PRJ_202606001"
echo ""
echo "----------------------------------------"
echo ""

echo "【4】查看项目 PRJ_202606001 的图纸历史"
curl -s -H "X-User-Id: USER_001" "$BASE_URL/drawings/history/PRJ_202606001" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/drawings/history/PRJ_202606001"
echo ""
echo "----------------------------------------"
echo ""

echo "【5】查看项目 PRJ_202606002 的生产排单（已确认的排单回看）"
curl -s -H "X-User-Id: USER_001" "$BASE_URL/schedules/project/PRJ_202606002" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/schedules/project/PRJ_202606002"
echo ""
echo "----------------------------------------"
echo ""

echo "【6】查看项目 PRJ_202606002 的操作记录时间线"
curl -s -H "X-User-Id: USER_001" "$BASE_URL/records/timeline/PRJ_202606002" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/records/timeline/PRJ_202606002"
echo ""
echo "----------------------------------------"
echo ""

echo "【7】幂等测试 - 项目专员王明(USER_001)提交图纸确认（相同 Idempotency-Key 调用两次）"
IDEM_KEY="drawing-submit-$(date +%s)"
echo "第一次调用 (Idempotency-Key: $IDEM_KEY):"
curl -s -X POST \
  -H "X-User-Id: USER_001" \
  -H "X-Idempotency-Key: $IDEM_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "v4",
    "fileName": "WDGY-A区设计图_v4.pdf",
    "fileUrl": "/files/WDGY-A区设计图_v4.pdf",
    "changes": ["外墙标识面板厚度从2mm调整为3mm", "增加无障碍通道标识"]
  }' \
  "$BASE_URL/drawings/submit/PRJ_202606001" | python3 -m json.tool 2>/dev/null
echo ""
echo "第二次调用 (相同 Idempotency-Key):"
curl -s -X POST \
  -H "X-User-Id: USER_001" \
  -H "X-Idempotency-Key: $IDEM_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "v4",
    "fileName": "WDGY-A区设计图_v4.pdf",
    "fileUrl": "/files/WDGY-A区设计图_v4.pdf",
    "changes": ["外墙标识面板厚度从2mm调整为3mm", "增加无障碍通道标识"]
  }' \
  "$BASE_URL/drawings/submit/PRJ_202606001" | python3 -m json.tool 2>/dev/null
echo ""
echo "----------------------------------------"
echo ""

echo "【8】权限测试 - 安装负责人张伟(USER_003)尝试确认图纸（应该被拒绝）"
DRAWING_ID=$(curl -s -H "X-User-Id: USER_001" "$BASE_URL/drawings?projectId=PRJ_202606001" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null || echo "DRW_test")
curl -s -X POST \
  -H "X-User-Id: USER_003" \
  -H "Content-Type: application/json" \
  -d '{"remark": "我来确认一下"}' \
  "$BASE_URL/drawings/confirm/$DRAWING_ID" | python3 -m json.tool 2>/dev/null
echo ""
echo "----------------------------------------"
echo ""

echo "【9】制作师傅李刚(USER_002)确认图纸"
echo "待确认图纸ID: $DRAWING_ID"
curl -s -X POST \
  -H "X-User-Id: USER_002" \
  -H "Content-Type: application/json" \
  -d '{"remark": "设计内容已核对，厚度调整合理，无障碍标识符合规范，可以进入生产环节"}' \
  "$BASE_URL/drawings/confirm/$DRAWING_ID" | python3 -m json.tool 2>/dev/null
echo ""
echo "----------------------------------------"
echo ""

echo "【10】制作师傅李刚(USER_002)提交生产排单"
curl -s -X POST \
  -H "X-User-Id: USER_002" \
  -H "Content-Type: application/json" \
  -d '{
    "productionStartDate": "2026-06-20",
    "productionEndDate": "2026-06-25",
    "installStartDate": "2026-06-27",
    "installEndDate": "2026-06-30",
    "materialPlan": [
      {"name": "304不锈钢板 3mm", "quantity": "30张", "eta": "2026-06-18"},
      {"name": "亚克力板 5mm", "quantity": "15张", "eta": "2026-06-17"},
      {"name": "LED光源模块", "quantity": "120套", "eta": "2026-06-17"}
    ],
    "productionTasks": [
      {"name": "激光切割", "worker": "李刚", "date": "2026-06-20", "duration": "1.5天"},
      {"name": "折弯焊接", "worker": "李刚、赵强", "date": "2026-06-22", "duration": "1.5天"},
      {"name": "表面处理烤漆", "worker": "外包", "date": "2026-06-24", "duration": "1天"},
      {"name": "组装调试", "worker": "李刚", "date": "2026-06-25", "duration": "0.5天"}
    ],
    "installPlan": [
      {"area": "A区主入口", "items": 5, "workers": "张伟、刘强", "date": "2026-06-27"},
      {"area": "A区室内楼层导视", "items": 45, "workers": "张伟、刘强、王健", "date": "2026-06-28"},
      {"area": "B1停车场导视", "items": 25, "workers": "张伟、王健", "date": "2026-06-29"},
      {"area": "外墙标识", "items": 3, "workers": "张伟、外包吊装队", "date": "2026-06-30"}
    ]
  }' \
  "$BASE_URL/schedules/submit/PRJ_202606001" | python3 -m json.tool 2>/dev/null
echo ""
echo "----------------------------------------"
echo ""

echo "【11】项目专员王明(USER_001)确认生产排单"
SCHEDULE_ID=$(curl -s -H "X-User-Id: USER_001" "$BASE_URL/schedules?projectId=PRJ_202606001" | python3 -c "import sys,json; data=json.load(sys.stdin)['data']; pending=[s for s in data if s['status']=='PENDING']; print(pending[0]['id'] if pending else data[0]['id'])" 2>/dev/null || echo "SCH_test")
echo "待确认排单ID: $SCHEDULE_ID"
curl -s -X POST \
  -H "X-User-Id: USER_001" \
  -H "Content-Type: application/json" \
  -d '{"remark": "排单合理，外墙标识吊装请提前与物业确认吊车占道时间，注意施工安全"}' \
  "$BASE_URL/schedules/confirm/$SCHEDULE_ID" | python3 -m json.tool 2>/dev/null
echo ""
echo "----------------------------------------"
echo ""

echo "【12】查看流转完成后项目 PRJ_202606001 的最新状态和完整时间线"
curl -s -H "X-User-Id: USER_001" "$BASE_URL/projects/PRJ_202606001" | python3 -m json.tool 2>/dev/null
echo ""
echo "========================================"
echo "示例请求执行完毕"
echo "========================================"
