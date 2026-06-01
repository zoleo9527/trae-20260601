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

print('=== 测试1: 新增节点 - 传入非医生 doctor_id（库管ID=15）应该被拒绝 ===')
r = requests.post(f'{BASE}/schedules', headers=fd_headers, json={
    'patient_id': 21, 'node_type': 'film', 'planned_date': '2026-06-15', 'doctor_id': 15
})
print(f'  状态: {r.status_code}, 响应: {r.json()}')

print('\n=== 测试2: 新增节点 - 传入不存在的 doctor_id=999 应该被拒绝 ===')
r = requests.post(f'{BASE}/schedules', headers=fd_headers, json={
    'patient_id': 21, 'node_type': 'film', 'planned_date': '2026-06-15', 'doctor_id': 999
})
print(f'  状态: {r.status_code}, 响应: {r.json()}')

print('\n=== 测试3: 新增节点 - 传入有效医生 doctor_id=14 应该成功 ===')
r = requests.post(f'{BASE}/schedules', headers=fd_headers, json={
    'patient_id': 21, 'node_type': 'film', 'planned_date': '2026-06-15', 'doctor_id': 14, 'notes': 'API测试节点'
})
d = r.json()
print(f'  状态: {r.status_code}, 节点ID: {d.get("id")}, 医生: {d.get("doctor_name")}')

print('\n=== 测试4: 更新节点 - 传入非医生 doctor_id=15 应该被拒绝 ===')
r = requests.put(f'{BASE}/schedules/124', headers=fd_headers, json={'doctor_id': 15})
print(f'  状态: {r.status_code}, 响应: {r.json()}')

print('\n=== 测试5: 更新节点 - 传入有效医生 doctor_id=14 应该成功 ===')
r = requests.put(f'{BASE}/schedules/124', headers=fd_headers, json={'doctor_id': 14})
d = r.json()
print(f'  状态: {r.status_code}, 节点ID: {d.get("id")}, 医生: {d.get("doctor_name")}')

print('\n=== 测试6: 患者详情 - 确认只返回有效 doctor_name ===')
r = requests.get(f'{BASE}/patients/21', headers=li_headers)
d = r.json()
nodes = d['treatment_nodes']
print(f'  节点总数: {len(nodes)}')
for n in nodes:
    if n.get('doctor_id') and not n.get('doctor_name'):
        print(f'  ✗ 节点 {n["id"]} 有 doctor_id={n["doctor_id"]} 但 doctor_name 为空')
    elif n.get('doctor_name'):
        print(f'  ✓ 节点 {n["id"]}: {n["node_type"]} - 医生: {n["doctor_name"]}')
    else:
        print(f'  - 节点 {n["id"]}: {n["node_type"]} - 未指定医生')

print('\n=== 测试7: 日志确认数据修复记录 ===')
r = requests.get(f'{BASE}/logs', headers=li_headers, params={'user_name': 'system'})
data = r.json()
logs = data['logs']
print(f'  系统日志数: {len(logs)}')
for log in logs[:3]:
    print(f'  - {log["created_at"]}: {log["detail"][:60]}...')
