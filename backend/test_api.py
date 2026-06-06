import urllib.request
import json

BASE_URL = 'http://localhost:8001/api/v1'

print('=' * 70)
print('1. 测试看板统计接口')
print('=' * 70)
with urllib.request.urlopen(f'{BASE_URL}/dashboard/stats') as resp:
    data = json.loads(resp.read())
    print(json.dumps(data, ensure_ascii=False, indent=2))

print('\n' + '=' * 70)
print('2. 测试所有角色待办列表（验证退回和异常已纳入）')
print('=' * 70)
with urllib.request.urlopen(f'{BASE_URL}/todos') as resp:
    data = json.loads(resp.read())
    for todo in data:
        print(f"\n角色: {todo['role_name']} ({todo['pending_count']}条待办)")
        for item in todo['items']:
            extra_info = []
            if item.get('exception_note'):
                extra_info.append(f"⚠️ 异常: {item['exception_note'][:30]}...")
            if item.get('return_reason'):
                extra_info.append(f"🔄 退回: {item['return_reason'][:30]}...")
            extra_str = ' | '.join(extra_info) if extra_info else ''
            print(f"  - {item['vehicle_plate']}: {item['status']} | {item['dock_number']}")
            if extra_str:
                print(f"       {extra_str}")

print('\n' + '=' * 70)
print('3. 测试作业单列表（验证返回字段包含退回原因、异常说明、备注）')
print('=' * 70)
with urllib.request.urlopen(f'{BASE_URL}/work-orders') as resp:
    data = json.loads(resp.read())
    print(f"共 {len(data)} 条作业单")
    for o in data[:5]:
        print(f"\n  {o['vehicle_plate']} | {o['status']} | 负责: {o.get('current_role', '-')}")
        if o.get('exception_note'):
            print(f"    ⚠️ 异常说明: {o['exception_note']}")
        if o.get('return_reason'):
            print(f"    🔄 退回原因: {o['return_reason']}")
        if o.get('supplementary_notes'):
            print(f"    📝 补充备注: {o['supplementary_notes'][:50]}...")

print('\n' + '=' * 70)
print('4. 测试异常单详情（验证调度员负责 + 异常说明存在）')
print('=' * 70)
exception_orders = [o for o in data if o['status'] == 'exception']
if exception_orders:
    test_id = exception_orders[0]['id']
    with urllib.request.urlopen(f'{BASE_URL}/work-orders/{test_id}') as resp:
        detail = json.loads(resp.read())
        print(f"作业单: {detail['vehicle_plate']}")
        print(f"状态: {detail['status']}")
        print(f"当前负责角色: {detail.get('current_role', 'NONE')}")
        print(f"异常说明: {detail.get('exception_note', 'NONE')}")
        print(f"补充备注: {detail.get('supplementary_notes', 'NONE')}")
        if detail.get('current_role') == 'dispatcher':
            print("✅ 异常单正确由调度员负责")
        else:
            print("❌ 异常单负责角色错误")

print('\n' + '=' * 70)
print('5. 测试退回单详情（验证叉车班长负责 + 退回原因存在）')
print('=' * 70)
returned_orders = [o for o in data if o['status'] == 'returned']
if returned_orders:
    test_id = returned_orders[0]['id']
    with urllib.request.urlopen(f'{BASE_URL}/work-orders/{test_id}') as resp:
        detail = json.loads(resp.read())
        print(f"作业单: {detail['vehicle_plate']}")
        print(f"状态: {detail['status']}")
        print(f"当前负责角色: {detail.get('current_role', 'NONE')}")
        print(f"退回原因: {detail.get('return_reason', 'NONE')}")
        print(f"补充备注: {detail.get('supplementary_notes', 'NONE')}")
        if detail.get('current_role') == 'forklift_leader':
            print("✅ 退回单正确由叉车班长负责")
        else:
            print("❌ 退回单负责角色错误")

print('\n' + '=' * 70)
print('✅ 全部测试完成！')
print('=' * 70)
