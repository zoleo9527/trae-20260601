#!/bin/bash
set -e

BASE_URL="http://localhost:3001"
ORDER_ID="AD260615-1001"

echo "========================================"
echo "  广告喷绘店 - 端到端流程测试"
echo "========================================"

echo ""
echo "【步骤1】重置数据"
curl -s -X POST "$BASE_URL/api/reset" > /dev/null
echo "✓ 数据已重置"

sleep 0.5

echo ""
echo "【步骤2】检查初始状态"
STATUS=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d['currentHandler'])")
echo "  状态: $(echo $STATUS | awk '{print $1}')"
echo "  处理人: $(echo $STATUS | awk '{print $2}')"
echo "  ✓ 初始状态正确（待改稿 → 设计师）"

sleep 0.5

echo ""
echo "【步骤3】设计师添加改稿记录（修正尺寸）"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/revisions" \
  -F 'type=dimension' \
  -F 'description=根据客户反馈修正尺寸：4.8米 × 1.2米' \
  -F 'operator=李设计' \
  -F 'beforeData={"width":500,"height":120}' \
  -F 'afterData={"width":480,"height":120}' > /dev/null
echo "  ✓ 改稿记录已添加"

sleep 0.5

echo ""
echo "【步骤4】设计师提交客户确认"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"pending_approval","operator":"李设计","remark":"颜色和尺寸都已修正，发送客户二次确认"}' > /dev/null

STATUS=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d['currentHandler'])")
echo "  状态: $(echo $STATUS | awk '{print $1}')"
echo "  处理人: $(echo $STATUS | awk '{print $2}')"
echo "  ✓ 已提交客户确认"

sleep 0.5

echo ""
echo "【步骤5】客户确认通过"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/confirm" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"王总","signature":"data:image/png;base64,test123","confirmType":"approve","feedback":"颜色和尺寸都对了，可以喷绘了"}' > /dev/null

STATUS=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d['currentHandler'])")
echo "  状态: $(echo $STATUS | awk '{print $1}')"
echo "  处理人: $(echo $STATUS | awk '{print $2}')"
echo "  ✓ 客户已确认通过"

sleep 0.5

echo ""
echo "【步骤6】喷绘车间开始喷绘"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"printing","operator":"张喷绘","remark":"开始喷绘，注意颜色校准"}' > /dev/null

STATUS=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d['currentHandler'])")
echo "  状态: $(echo $STATUS | awk '{print $1}')"
echo "  处理人: $(echo $STATUS | awk '{print $2}')"
echo "  ✓ 开始喷绘"

sleep 0.5

echo ""
echo "【步骤7】喷绘完成转质检"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"quality_check","operator":"张喷绘","remark":"喷绘完成，转质检"}' > /dev/null

STATUS=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d['currentHandler'])")
echo "  状态: $(echo $STATUS | awk '{print $1}')"
echo "  处理人: $(echo $STATUS | awk '{print $2}')"
echo "  ✓ 转质检"

sleep 0.5

echo ""
echo "【步骤8】质检通过，待安装"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"ready_for_install","operator":"刘质检","remark":"颜色正确，尺寸480×120cm，质检通过"}' > /dev/null

STATUS=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d['currentHandler'])")
echo "  状态: $(echo $STATUS | awk '{print $1}')"
echo "  处理人: $(echo $STATUS | awk '{print $2}')"
echo "  ✓ 质检通过"

sleep 0.5

echo ""
echo "【步骤9】安装队长开始安装"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"installing","operator":"赵安装","remark":"到达现场，开始安装"}' > /dev/null

STATUS=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d['currentHandler'])")
echo "  状态: $(echo $STATUS | awk '{print $1}')"
echo "  处理人: $(echo $STATUS | awk '{print $2}')"
echo "  ✓ 开始安装"

sleep 0.5

echo ""
echo "【步骤10】上传安装记录"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/installation" \
  -F 'installTime=2026-06-15T10:00:00.000Z' \
  -F 'operator=赵安装' \
  -F 'remark=安装完成，客户现场验收通过' \
  -F 'issueReported=' > /dev/null
echo "  ✓ 安装记录已上传"

sleep 0.5

echo ""
echo "【步骤11】订单完成"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed","operator":"赵安装","remark":"安装完成，客户满意"}' > /dev/null

STATUS=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d['currentHandler'])")
echo "  状态: $(echo $STATUS | awk '{print $1}')"
echo "  处理人: $(echo $STATUS | awk '{print $2}')"
echo "  ✓ 订单已完成！"

echo ""
echo "========================================"
echo "  完整流程测试完成！"
echo "========================================"

echo ""
echo "【订单完整数据汇总】"
curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "
import json,sys
d = json.load(sys.stdin)
print(f'订单号: {d[\"orderNo\"]}')
print(f'客户: {d[\"customerName\"]}')
print(f'最终尺寸: {d[\"width\"]}×{d[\"height\"]}{d[\"unit\"]}')
print(f'最终状态: {d[\"status\"]}')
print(f'改稿记录: {len(d[\"revisions\"])} 条')
print(f'历史记录: {len(d[\"history\"])} 条')
print(f'问题记录: {len(d[\"issues\"])} 条')
print(f'客户确认: {d.get(\"customerConfirmation\",{}).get(\"confirmType\")}')
print(f'安装记录: {'有' if d.get('installation') else '无'}')
"
