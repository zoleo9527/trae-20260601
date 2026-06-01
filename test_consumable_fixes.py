import requests

BASE = 'http://localhost:3001/api'

def login(username, password):
    r = requests.post(f'{BASE}/auth/login', json={'username': username, 'password': password})
    return r.json()['token']

li_token = login('liys', '123456')
fd_token = login('zhangqt', '123456')
wh_token = login('wangkg', '123456')
li_headers = {'Authorization': f'Bearer {li_token}'}
fd_headers = {'Authorization': f'Bearer {fd_token}'}
wh_headers = {'Authorization': f'Bearer {wh_token}'}

print('=== 测试1: 耗材列表 - 应该包含 patient_name 字段 ===')
r = requests.get(f'{BASE}/consumables', headers=wh_headers)
data = r.json()
has_patient_name = any(c.get('patient_name') for c in data if c.get('patient_id'))
print(f'  耗材总数: {len(data)}')
used_or_locked = [c for c in data if c['status'] in ('used', 'locked')]
print(f'  已使用/已锁定: {len(used_or_locked)} 条')
for c in used_or_locked[:5]:
    print(f'  - {c["name"]} ({c["model"]}) 状态={c["status"]} patient_id={c.get("patient_id")} patient_name={c.get("patient_name")}')

print('\n=== 测试2: 锁定耗材后标记已使用 - patient_id 不应被清除 ===')
r = requests.get(f'{BASE}/consumables', headers=wh_headers, params={'status': 'available'})
available = r.json()
if available:
    test_item = available[0]
    print(f'  选择耗材: {test_item["name"]} (ID: {test_item["id"]})')

    r = requests.post(f'{BASE}/consumables/{test_item["id"]}/lock', headers=fd_headers, json={'patient_id': 21})
    locked = r.json()
    print(f'  锁定后: patient_id={locked.get("patient_id")} patient_name={locked.get("patient_name")} status={locked["status"]}')

    r = requests.post(f'{BASE}/consumables/{test_item["id"]}/use', headers=li_headers, json={'patient_id': 21})
    used = r.json()
    print(f'  使用后: patient_id={used.get("patient_id")} patient_name={used.get("patient_name")} status={used["status"]}')

    if used.get('patient_id') == 21:
        print('  ✓ 使用后 patient_id 保留，追溯链路完整')
    else:
        print(f'  ✗ 使用后 patient_id 丢失！值为: {used.get("patient_id")}')
else:
    print('  没有可用耗材，跳过')

print('\n=== 测试3: 患者详情 - 应该展示已使用耗材 ===')
r = requests.get(f'{BASE}/patients/21', headers=li_headers)
d = r.json()
consuming = d.get('consumables', [])
print(f'  患者关联耗材: {len(consuming)} 条')
for c in consuming:
    print(f'  - {c["name"]} ({c["model"]}) 状态={c["status"]} 批次={c.get("batch_no")}')

print('\n=== 测试4: 操作日志 - 耗材操作应包含患者ID ===')
r = requests.get(f'{BASE}/logs', headers=li_headers, params={'limit': 10})
data = r.json()
consumable_logs = [l for l in data['logs'] if '耗材' in l.get('action', '')]
print(f'  耗材相关日志: {len(consumable_logs)} 条')
for l in consumable_logs[:5]:
    print(f'  - [{l["action"]}] detail={l["detail"][:40]}... patient_id={l.get("patient_id")}')

print('\n=== 测试5: 耗材变更提醒 - 应包含患者关联 ===')
r = requests.get(f'{BASE}/alerts', headers=li_headers)
alerts = r.json()
change_alerts = [a for a in alerts if a['type'] == 'consumable_change']
print(f'  耗材变更提醒: {len(change_alerts)} 条')
for a in change_alerts:
    print(f'  - patient_id={a.get("patient_id")} patient_name={a.get("patient_name")} msg={a["message"][:50]}...')
