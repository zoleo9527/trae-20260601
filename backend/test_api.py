import urllib.request
import json

BASE_URL = 'http://localhost:8001/api/v1'

print('=' * 60)
print('1. 测试看板统计接口')
print('=' * 60)
with urllib.request.urlopen(f'{BASE_URL}/dashboard/stats') as resp:
    data = json.loads(resp.read())
    print(json.dumps(data, ensure_ascii=False, indent=2))

print('\n' + '=' * 60)
print('2. 测试所有角色待办列表')
print('=' * 60)
with urllib.request.urlopen(f'{BASE_URL}/todos') as resp:
    data = json.loads(resp.read())
    for todo in data:
        print(f"\n角色: {todo['role_name']} ({todo['pending_count']}条待办)")
        for item in todo['items'][:2]:
            print(f"  - {item['vehicle_plate']}: {item['dock_number']} | {item['cargo_type']}")

print('\n' + '=' * 60)
print('3. 测试作业单列表（取前3条）')
print('=' * 60)
with urllib.request.urlopen(f'{BASE_URL}/work-orders') as resp:
    data = json.loads(resp.read())
    for o in data[:3]:
        print(f"  {o['vehicle_plate']} | {o['status']} | {o['dock_number']}")

print('\n' + '=' * 60)
print('4. 测试已完成作业单时间线（作业计时回看）')
print('=' * 60)
completed = [o for o in data if o['status'] == 'completed']
if completed:
    test_id = completed[0]['id']
    with urllib.request.urlopen(f'{BASE_URL}/work-orders/{test_id}/timeline') as resp:
        timeline = json.loads(resp.read())
        print(f"作业单: {timeline['vehicle_plate']} - {timeline['status_name']}")
        print(f"时间信息: {json.dumps(timeline['timing_info'], ensure_ascii=False, indent=2)}")
        print("\n状态时间线:")
        for t in timeline['timeline']:
            print(f"  [{t['time'][:19]}] {t['operator_role_name']} - {t['operator_name']}: {t['remark']}")

print('\n' + '=' * 60)
print('✅ API 测试完成！')
print('=' * 60)
