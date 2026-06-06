import urllib.request
import json

BASE_URL = 'http://localhost:8001/api/v1'

print('=' * 70)
print('一致性验证：API 待办接口 vs 预期结果')
print('=' * 70)

print('\n📊 预期待办分配（基于 current_role）:')
print('  调度员 (dispatcher): 待派工(2) + 异常(1) = 3条')
print('  叉车班长 (forklift_leader): 已派工(1) + 作业中(1) + 退回(1) = 3条')
print('  仓库文员 (warehouse_clerk): 待确认(1) = 1条')

print('\n' + '-' * 70)
print('🔍 验证 API /todos 接口返回:')
print('-' * 70)

with urllib.request.urlopen(f'{BASE_URL}/todos') as resp:
    todos_data = json.loads(resp.read())

expected_counts = {
    'dispatcher': 3,
    'forklift_leader': 3,
    'warehouse_clerk': 1,
}

role_names = {
    'dispatcher': '调度员',
    'forklift_leader': '叉车班长',
    'warehouse_clerk': '仓库文员',
}

all_pass = True
for todo in todos_data:
    role = todo['role']
    count = todo['pending_count']
    expected = expected_counts.get(role, 0)
    status = '✅' if count == expected else '❌'
    if count != expected:
        all_pass = False
    print(f"  {status} {role_names[role]}: API返回 {count} 条, 预期 {expected} 条")
    
    if count > 0:
        for item in todo['items']:
            extra = []
            if item.get('return_reason'):
                extra.append('🔄有退回原因')
            if item.get('exception_note'):
                extra.append('⚠️有异常说明')
            if item.get('supplementary_notes'):
                extra.append('📝有备注')
            extra_str = ' | '.join(extra) if extra else ''
            print(f"       - {item['vehicle_plate']}: {item['status']} {extra_str}")

print('\n' + '-' * 70)
print('🔍 验证退回单落到叉车班长待办:')
print('-' * 70)

forklift_todo = [t for t in todos_data if t['role'] == 'forklift_leader'][0]
returned_items = [i for i in forklift_todo['items'] if i['status'] == 'returned']
if returned_items:
    print(f"  ✅ 叉车班长待办中包含 {len(returned_items)} 条退回单")
    for item in returned_items:
        print(f"     - {item['vehicle_plate']}: {item['return_reason'][:40]}...")
else:
    print("  ❌ 叉车班长待办中没有退回单")
    all_pass = False

print('\n' + '-' * 70)
print('🔍 验证异常单落到调度员待办:')
print('-' * 70)

dispatcher_todo = [t for t in todos_data if t['role'] == 'dispatcher'][0]
exception_items = [i for i in dispatcher_todo['items'] if i['status'] == 'exception']
if exception_items:
    print(f"  ✅ 调度员待办中包含 {len(exception_items)} 条异常单")
    for item in exception_items:
        print(f"     - {item['vehicle_plate']}: {item['exception_note'][:40]}...")
else:
    print("  ❌ 调度员待办中没有异常单")
    all_pass = False

print('\n' + '-' * 70)
print('🔍 验证作业单列表返回字段完整:')
print('-' * 70)

with urllib.request.urlopen(f'{BASE_URL}/work-orders') as resp:
    orders = json.loads(resp.read())

fields_check = ['return_reason', 'exception_note', 'supplementary_notes', 'current_role']
field_results = {f: 0 for f in fields_check}

for order in orders:
    for f in fields_check:
        if order.get(f) is not None:
            field_results[f] += 1

for f, count in field_results.items():
    print(f"  ✅ 字段 '{f}': {count} 条记录有值")

print('\n' + '=' * 70)
if all_pass:
    print('🎉 全部验证通过！API 待办接口与 current_role 分配完全一致')
else:
    print('❌ 存在不一致，请检查')
print('=' * 70)
