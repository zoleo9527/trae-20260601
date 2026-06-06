#!/bin/bash
BASE="http://127.0.0.1:4000/api"

echo "=== 1. 测试健康检查 ==="
curl -s "$BASE/health"
echo ""
echo ""

echo "=== 2. 测试 cases 列表（有驳回记录）==="
curl -s -H "x-user-role: business" "$BASE/cases?hasReject=true" | python3 -c "
import sys, json
data = json.load(sys.stdin)
cases = data.get('cases', [])
print(f'返回 {len(cases)} 条记录')
for c in cases:
    print(f\"  {c['id']}: {c['brandName']} - 状态:{c['status']}\")
    print(f\"    责任角色: {c.get('responsibleRole', '-')}, 有驳回:{c.get('hasReject', '-')}, 有补录:{c.get('hasSupplementary', '-')}\")
    print(f\"    最近退回: {c.get('latestRejectReason', '-')}\")
    print(f\"    补录摘要: {c.get('supplementarySummary', '-')}\")
"
echo ""

echo "=== 3. 测试 cases 列表（按当前处理角色筛选 director）==="
curl -s -H "x-user-role: business" "$BASE/cases?currentHandler=director" | python3 -c "
import sys, json
data = json.load(sys.stdin)
cases = data.get('cases', [])
print(f'返回 {len(cases)} 条记录')
for c in cases:
    print(f\"  {c['id']}: {c['brandName']} - 状态:{c['status']}, 处理人:{c['currentHandler']}\")
"
echo ""

echo "=== 4. 测试导出接口 ==="
curl -s -o /tmp/test_export.xlsx -w "HTTP状态: %{http_code}, 文件大小: %{size_download} 字节" \
  -H "x-user-role: business" "$BASE/export/cases?hasReject=true"
echo ""
echo "导出文件已保存到 /tmp/test_export.xlsx"
