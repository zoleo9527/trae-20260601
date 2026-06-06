#!/bin/bash
BASE="http://127.0.0.1:4000/api"

echo "=== 1. 测试健康检查 ==="
curl -s "$BASE/health"
echo ""
echo ""

echo "=== 2. 测试 tickets 列表（有驳回记录）==="
curl -s -H "x-user-role: scheduling_manager" "$BASE/tickets?hasReject=true" | python3 -c "
import sys, json
data = json.load(sys.stdin)
tickets = data.get('data', [])
print(f'返回 {len(tickets)} 条记录')
for t in tickets:
    print(f\"  {t['orderNo']}: {t['companyName']} - {t['movieName']} - 状态:{t.get('statusLabel', t['status'])}\")
    print(f\"    当前责任人: {t.get('currentHandlerLabel', t['currentHandler'])}, 有驳回:{t.get('hasReject', '-')}, 有补充备注:{t.get('hasSupplementary', '-')}\")
"
echo ""

echo "=== 3. 测试 tickets 列表（按当前处理角色筛选 ticket_supervisor）==="
curl -s -H "x-user-role: ticket_supervisor" "$BASE/tickets?handler=ticket_supervisor" | python3 -c "
import sys, json
data = json.load(sys.stdin)
tickets = data.get('data', [])
print(f'返回 {len(tickets)} 条记录')
for t in tickets:
    print(f\"  {t['orderNo']}: {t['companyName']} - {t['movieName']} - 状态:{t.get('statusLabel', t['status'])}, 处理人:{t.get('currentHandlerLabel', t['currentHandler'])}\")
"
echo ""

echo "=== 4. 测试待办接口（scheduling_manager 角色）==="
curl -s -H "x-user-role: scheduling_manager" "$BASE/todos" | python3 -c "
import sys, json
data = json.load(sys.stdin)
todos = data.get('data', [])
print(f'返回 {len(todos)} 条待办')
for t in todos:
    print(f\"  {t['title']} - {t.get('ticket', {}).get('companyName', '')}\")
"
echo ""

echo "=== 5. 测试导出接口 ==="
curl -s -o /tmp/test_tickets_export.csv -w "HTTP状态: %{http_code}, 文件大小: %{size_download} 字节" \
  -H "x-user-role: duty_manager" "$BASE/export/tickets?hasReject=true"
echo ""
echo "导出文件已保存到 /tmp/test_tickets_export.csv"
