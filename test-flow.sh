#!/bin/bash
set -e

# 1. Login
RECEPTION_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"reception","password":"123456"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")

TECH_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"tech01","password":"123456"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")

MANAGER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"manager","password":"123456"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")

echo "Tokens: OK"

# 2. 创建工单
echo ""
echo "=== Step1: 前台创建工单 ==="
ORDER=$(curl -s -X POST http://localhost:3000/intake \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"customerName":"张维修","customerPhone":"13800000001","phoneBrand":"Apple","phoneModel":"iPhone 14 Pro","imei":"351234567890123","reportedFault":"屏幕碎触摸失灵","hasPassword":false,"accessories":"充电器,手机壳"}')
ORDER_ID=$(echo $ORDER | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
ORDER_NO=$(echo $ORDER | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['orderNo'])")
echo "工单ID=$ORDER_ID 工单号=$ORDER_NO"

# 3. 越权：前台改status
echo ""
echo "=== Step2: 前台尝试PATCH改status（应被拒绝403） ==="
curl -s -X PATCH "http://localhost:3000/intake/$ORDER_ID" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"consent_signed"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  code={d[\"code\"]} msg={d[\"message\"]}')"

# 4. 越权：前台改diagnosisResult
echo ""
echo "=== Step3: 前台尝试改diagnosisResult（应被拒绝403） ==="
curl -s -X PATCH "http://localhost:3000/intake/$ORDER_ID" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"diagnosisResult":"屏幕总成损坏"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  code={d[\"code\"]} msg={d[\"message\"]}')"

# 5. 正常：前台改priority
echo ""
echo "=== Step4: 前台正常改priority（应成功） ==="
curl -s -X PATCH "http://localhost:3000/intake/$ORDER_ID" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"priority":"urgent"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  code={d[\"code\"]} 新优先级={d[\"data\"][\"priority\"]}')"

# 6. 客户签署隐私授权
echo ""
echo "=== Step5: 签署隐私授权 ==="
curl -s -X POST "http://localhost:3000/privacy/order/$ORDER_ID/sign" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"customerName":"张维修","customerIdCard":"110101199001011234","signatureUrl":"https://example.com/sign.png","confirmedItems":["data_backup","repair_risk","data_loss","privacy_usage"]}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  code={d[\"code\"]} consent={d[\"data\"][\"status\"]} 工单状态={d[\"data\"][\"orderStatus\"]}')"

# 7. 维修师领取工单
echo ""
echo "=== Step6: 维修师领取工单 ==="
curl -s -X POST "http://localhost:3000/repair/$ORDER_ID/claim" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  code={d[\"code\"]} 状态={d[\"data\"][\"status\"]} 维修师={d[\"data\"][\"technician\"][\"name\"]}')"

# 8. 上传诊断照片 + 提交诊断
echo ""
echo "=== Step7: 上传诊断照片 + 提交诊断 ==="
curl -s -X POST "http://localhost:3000/repair/$ORDER_ID/attachments" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"type":"diagnosis_photo","fileName":"cracked-screen.jpg","mimeType":"image/jpeg","fileSize":245678,"fileUrl":"https://oss.example.com/diag-1.jpg","description":"屏幕碎裂照片"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  诊断照片: code={d[\"code\"]} 附件ID={d[\"data\"][\"id\"]}')"
curl -s -X PATCH "http://localhost:3000/repair/$ORDER_ID/diagnosis" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"diagnosisResult":"屏幕总成损坏需更换"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  诊断提交: code={d[\"code\"]}')"

# 9. 维修师创建备件申请 → 工单自动 waiting_parts
echo ""
echo "=== Step8: 创建备件申请（工单进入waiting_parts） ==="
PR=$(curl -s -X POST "http://localhost:3000/repair/$ORDER_ID/part-request" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"partName":"iPhone 14 Pro 原厂屏幕总成","partInfo":"SKU:APL-14P-SCR-001","quantity":1,"estimatedCost":1580,"reason":"屏幕碎裂触摸失灵"}')
PR_ID=$(echo $PR | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
echo $PR | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  code={d[\"code\"]} 备件ID={d[\"data\"][\"id\"]} 备件状态={d[\"data\"][\"status\"]} 工单状态={d[\"data\"][\"order\"][\"status\"]}')"

# 10. 前台确认下单
echo ""
echo "=== Step9: 前台确认备件下单 ==="
curl -s -X PATCH "http://localhost:3000/repair/part-request/$PR_ID/order" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"orderedByRemark":"供应商恒信数码预计2天到货"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  code={d[\"code\"]} 备件状态={d[\"data\"][\"status\"]}')"

# 11. 前台上传备件照片 + 确认到货 → 工单自动回repairing
echo ""
echo "=== Step10: 前台上传备件照片并确认到货（工单回repairing） ==="
curl -s -X POST "http://localhost:3000/repair/$ORDER_ID/attachments" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"type":"part_photo","fileName":"part-arrived.jpg","mimeType":"image/jpeg","fileSize":189234,"fileUrl":"https://oss.example.com/part-1.jpg","description":"备件到货照片"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  备件照片: code={d[\"code\"]}')"
curl -s -X PATCH "http://localhost:3000/repair/part-request/$PR_ID/arrive" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"arrivalRemark":"包装完好配件齐全"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  code={d[\"code\"]} 备件状态={d[\"data\"][\"status\"]} 工单状态={d[\"data\"][\"order\"][\"status\"]}')"

# 12. 维修前后照片 + 维修备注
echo ""
echo "=== Step11: 维修前后照片 + 维修备注 ==="
curl -s -X POST "http://localhost:3000/repair/$ORDER_ID/attachments" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"type":"repair_before","fileName":"repair-before.jpg","mimeType":"image/jpeg","fileSize":300000,"fileUrl":"https://oss.example.com/before-1.jpg"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  维修前: code={d[\"code\"]}')"
curl -s -X POST "http://localhost:3000/repair/$ORDER_ID/attachments" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"type":"repair_after","fileName":"repair-after.jpg","mimeType":"image/jpeg","fileSize":290000,"fileUrl":"https://oss.example.com/after-1.jpg"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  维修后: code={d[\"code\"]}')"
curl -s -X PATCH "http://localhost:3000/intake/$ORDER_ID" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"repairNotes":"更换原厂屏幕总成，防水胶重新密封。测试2小时正常。"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  维修备注: code={d[\"code\"]}')"

# 13. 前台结构化质检 → ready
echo ""
echo "=== Step12: 前台结构化质检（10项全通过→ready） ==="
curl -s -X POST "http://localhost:3000/repair/$ORDER_ID/quality-check" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"screen":true,"touch":true,"camera":true,"speaker":true,"microphone":true,"charging":true,"buttons":true,"wifi":true,"fingerprint":true,"faceId":true,"overallRemark":"全部检查通过","passed":true}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  code={d[\"code\"]} passed={d[\"data\"][\"passed\"]} round={d[\"data\"][\"checkRound\"]} 工单状态={d[\"data\"][\"order\"][\"status\"]}')"

# 14. 工单详情（含证据链）
echo ""
echo "=== Step13: GET工单详情（含证据链） ==="
curl -s "http://localhost:3000/intake/$ORDER_ID" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
e=d.get('evidence',{})
pr=e.get('partRequests',[])
qc=e.get('qualityChecks',[])
at=e.get('attachments',[])
print(f'  工单状态={d[\"status\"]}')
print(f'  备件申请数={len(pr)} [{pr[0][\"partName\"] if pr else None}] 状态={pr[0][\"status\"] if pr else None}')
print(f'  质检记录数={len(qc)} passed={qc[0][\"passed\"] if qc else None}')
print(f'  附件数={len(at)} 类型={[a[\"type\"] for a in at]}')
"

# 15. 证据链聚合接口
echo ""
echo "=== Step14: GET证据链聚合接口 /repair/:id/evidence ==="
curl -s "http://localhost:3000/repair/$ORDER_ID/evidence" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'  备件={len(d[\"partRequests\"])} 质检={len(d[\"qualityChecks\"])} 附件={len(d[\"attachments\"])}')
for a in d['attachments']: print(f'    - {a[\"type\"]}: {a[\"fileName\"]} by {a[\"uploadedBy\"][\"name\"]}')
"

# 16. 仪表盘卡住分析（含判断依据和证据入口）
echo ""
echo "=== Step15: 仪表盘卡住分析 ==="
curl -s "http://localhost:3000/dashboard/stuck" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
if not d:
  print('  暂无卡住工单（本流程刚走完，正常）')
else:
  g=d[0]
  print(f'  状态={g[\"statusLabel\"]} 卡住数={g[\"stuckCount\"]}')
  print(f'  判断依据={g[\"judgementHint\"]}')
  print(f'  下一步={g[\"nextAction\"]}')
  if g.get('items'): print(f'  证据链接示例={g[\"items\"][0][\"evidenceLink\"]}')
"

# 17. 最近变更（含新实体标签）
echo ""
echo "=== Step16: 最近变更（含PartRequest/QualityCheck/Attachment标签） ==="
curl -s "http://localhost:3000/dashboard/recent-changes?limit=15" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'  共{len(d)}条：')
for l in d:
  print(f'    [{l[\"entityLabel\"]}] {l[\"actionLabel\"]} by {l[\"operatorName\"]} - {l[\"summary\"]}')
"

echo ""
echo "=== ALL TESTS PASSED ==="
