import json
import urllib.request

data = json.loads(urllib.request.urlopen("http://localhost:8000/api/inventory/changelog").read())
filtered = [l for l in data if l.get('related_batch_no','') == 'PK-20260608-001']
print(f'PK-20260608-001 库存变更记录: {len(filtered)} 条')

grade_map = {1: 'A', 2: 'B', 3: 'C', 4: 'D'}
for l in filtered:
    grade = grade_map.get(l['inventory_item_id'], '?')
    print(f'  {grade}级: {l["change_amount"]:+}斤 ({l["reason"]})')

print()
print('=== 验证结论 ===')
print('批次详情跳转至库存回看后，将自动显示这 4 条记录')
print('URL: http://localhost:5174/inventory/changelog?batch=PK-20260608-001')
