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
sleep 0.5
echo "  OK"

echo ""
echo "【步骤1】检查初始状态"
S=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'])")
PI=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(len([i for i in d['issues'] if i['status']=='pending']))")
W=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['width'])")
echo "  状态: $S (应为 revision_needed)"
echo "  pending issues: $PI (应为 2)"
echo "  width: $W (应为 500)"

echo ""
echo "【步骤2】添加尺寸改稿 - 应关闭dimension + customer_revision"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/revisions" \
  -F 'type=dimension' \
  -F 'description=客户反馈门头实际宽度为4.8米，修正尺寸500→480' \
  -F 'operator=李设计' \
  -F 'beforeData={"width":500,"height":120}' \
  -F 'afterData={"width":480,"height":120}' > /dev/null
echo "  OK - 检查写回和问题联动"
W=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['width'])")
PI=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(len([i for i in d['issues'] if i['status']=='pending']))")
IR=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(len([h for h in d['history'] if h['status']=='issue_resolved']))")
echo "  width=$W (应为480)"
echo "  pending issues=$PI (应为0 - dimension + customer_revision 都已关闭)"
echo "  issue_resolved history=$IR (应为1)"

echo ""
echo "【步骤3】添加颜色改稿 - 验证无更多pending issues"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/revisions" \
  -F 'type=color' \
  -F 'description=客户要求PANTONE 286C，调整logo颜色' \
  -F 'operator=李设计' \
  -F 'beforeData={"color":"#1E40AF","pantone":"PANTONE 287C"}' \
  -F 'afterData={"color":"#1D3557","pantone":"PANTONE 286C"}' > /dev/null
echo "  OK"
CM=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['colorMode'])")
echo "  colorMode=$CM (应为 PANTONE 286C)"

echo ""
echo "【步骤4】提交客户确认 (pending_approval)"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"pending_approval","operator":"李设计","remark":"改稿完成，送客户二次确认"}' > /dev/null
S=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'])")
H=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['currentHandler'])")
echo "  状态: $S (应为 pending_approval)"
echo "  当前处理: $H (应为 customer)"

echo ""
echo "【步骤5】客户确认通过 (approved)"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/confirm" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"王总","signature":"data:image/png;base64,sign","confirmType":"approve","feedback":"颜色和尺寸都没问题，可以喷绘了"}' > /dev/null
S=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'])")
H=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['currentHandler'])")
echo "  状态: $S (应为 approved)"
echo "  当前处理: $H (应为 production)"

echo ""
echo "【步骤6】喷绘 (printing)"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"printing","operator":"赵喷绘","remark":"开始喷绘，注意颜色校正为PANTONE 286C"}' > /dev/null
echo "  OK"

echo ""
echo "【步骤7】转质检 (quality_check)"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"quality_check","operator":"赵喷绘","remark":"喷绘完成，尺寸480×120cm核验正确"}' > /dev/null
echo "  OK"

echo ""
echo "【步骤8】质检通过 (ready_for_install)"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"ready_for_install","operator":"刘质检","remark":"颜色PANTONE 286C校验通过，尺寸正确，材质合格"}' > /dev/null
echo "  OK"

echo ""
echo "【步骤9】开始安装 (installing)"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"installing","operator":"王队长","remark":"安装队出发前往SOHO现代城"}' > /dev/null
S=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'])")
H=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['currentHandler'])")
echo "  状态: $S (应为 installing)"
echo "  当前处理: $H (应为 installer)"

echo ""
echo "【步骤10】上传安装记录"
curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/installation" \
  -F 'installTime=2026-06-15T10:00:00.000Z' \
  -F 'operator=王队长' \
  -F 'remark=门头招牌安装完成，客户现场验收通过' \
  -F 'issueReported=false' > /dev/null
echo "  OK"

echo ""
echo "【步骤11】完成 - 当前处理人清空 (completed)"
curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed","operator":"王队长","remark":"安装完成，订单闭环"}' > /dev/null
S=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'])")
H=$(curl -s "$BASE_URL/api/orders/$ORDER_ID" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['currentHandler'] or 'null')")
echo "  状态: $S (应为 completed)"
echo "  当前处理人: $H (应为 null，表示订单已闭环)"

echo ""
echo "========================================"
echo "  全流程测试完成！"
echo "========================================"
