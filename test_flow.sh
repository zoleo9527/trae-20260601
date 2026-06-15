#!/bin/bash
set -e

BASE_URL="http://localhost:3001"
ORDER_ID="AD260615-1001"

echo "========================================"
echo "  端到端流程测试"
echo "========================================"

echo ""
echo "【步骤0】重置数据"
curl -s -X POST "$BASE_URL/api/reset" > /dev/null
echo "  OK"

echo ""
echo "【步骤1】检查初始状态"
S=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'])")
echo "  状态: $S"

echo ""
echo "【步骤2】添加尺寸改稿"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/revisions" \
  -F 'type=dimension' \
  -F 'description=修正尺寸' \
  -F 'operator=李设计' \
  -F 'beforeData={"width":500,"height":120}' \
  -F 'afterData={"width":480,"height":120}' > /dev/null
echo "  OK - 检查写回"
W=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['width'])")
echo "  width=$W (应为480)"

echo ""
echo "【步骤3】添加颜色改稿"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/revisions" \
  -F 'type=color' \
  -F 'description=修正颜色' \
  -F 'operator=李设计' \
  -F 'beforeData={"color":"#1E40AF"}' \
  -F 'afterData={"color":"#1D3557","pantone":"PANTONE 286C"}' > /dev/null
echo "  OK - 检查问题联动"
PI=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(len([i for i in d['issues'] if i['status']=='pending']))")
echo "  pending issues=$PI (应为0)"

echo ""
echo "【步骤4】提交客户确认"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"pending_approval","operator":"李设计","remark":"修正完成"}' > /dev/null
S=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'])")
echo "  状态: $S"

echo ""
echo "【步骤5】客户确认通过"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/confirm" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"王总","signature":"data:image/png;base64,sign","confirmType":"approve","feedback":"OK"}' > /dev/null
S=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'])")
echo "  状态: $S"

echo ""
echo "【步骤6】喷绘"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"printing","operator":"张喷绘","remark":"开始喷绘"}' > /dev/null
echo "  OK"

echo ""
echo "【步骤7】转质检"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"quality_check","operator":"张喷绘","remark":"喷绘完成"}' > /dev/null
echo "  OK"

echo ""
echo "【步骤8】质检通过"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"ready_for_install","operator":"刘质检","remark":"质检通过"}' > /dev/null
echo "  OK"

echo ""
echo "【步骤9】开始安装"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"installing","operator":"赵安装","remark":"开始安装"}' > /dev/null
echo "  OK"

echo ""
echo "【步骤10】上传安装记录"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/installation" \
  -F 'installTime=2026-06-15T10:00:00.000Z' \
  -F 'operator=赵安装' \
  -F 'remark=安装完成' \
  -F 'issueReported=false' > /dev/null
echo "  OK"

echo ""
echo "【步骤11】完成"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed","operator":"赵安装","remark":"完成"}' > /dev/null
S=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'])")
echo "  状态: $S"

echo ""
echo "========================================"
echo "  全流程测试完成！"
echo "========================================"
