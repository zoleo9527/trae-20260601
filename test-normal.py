import urllib.request, json, time, sys

def api(method, path, token=None, data=None):
    url = 'http://localhost:3001' + path
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print('=== 正常单全流程测试 ===')

r = api('POST', '/api/auth/login', data={'username':'gate01','password':'gate01'})
gt = r['data']['token']
print(f'Step1 闸口员登录: {r["data"]["name"]}({r["data"]["role"]}) ✓')

r = api('POST', '/api/containers', gt, {'container_no':'TEST2024001','vessel':'COSCO SHIPPING','voyage':'V023E','target_port':'SHANGHAI','yard_slot':'E-01-01','free_storage_until':'2026-06-20'})
cid = r['data']['id']
print(f'Step2 进场登记: ID={cid}, 状态={r["data"]["status"]} ✓')

r = api('POST', '/api/auth/login', data={'username':'dispatch01','password':'dispatch01'})
dt = r['data']['token']
print(f'Step3 调度员登录 ✓')

r = api('POST', '/api/inspections', dt, {'container_id':cid,'type':'full','planned_at':'2026-06-10T09:00:00'})
iid = r['data']['id']
print(f'Step4 创建查验: ID={iid}, 状态={r["data"]["status"]} ✓')

r = api('PUT', f'/api/inspections/{iid}/notify', dt, {'notify_method':'phone'})
print(f'Step5 通知客户: 状态={r["data"]["status"]} ✓')

for step in ['open_box','unpack','repack']:
    r = api('PUT', f'/api/inspections/{iid}/execute', dt, {'step':step,'data':{}})
    print(f'Step6-{step}: {r["data"]["status"]} ✓')

r = api('PUT', f'/api/inspections/{iid}/execute', dt, {'step':'result','result':'released','remark':'查验正常放行'})
print(f'Step6-result: 状态={r["data"]["status"]} ✓')

time.sleep(0.5)
r = api('GET', '/api/move-tasks?size=20', dt)
tasks = [t for t in r['data'] if t.get('source_inspection_id') == iid]
if tasks:
    mtid = tasks[0]['id']
    print(f'Step7 自动创建移箱: ID={mtid}, {tasks[0]["from_slot"]}→{tasks[0]["to_slot"]} ✓')
else:
    print('Step7 自动创建移箱: 未找到! ✗')
    sys.exit(1)

r = api('PUT', f'/api/move-tasks/{mtid}/execute', dt, {'action':'start'})
print(f'Step8 开始移箱: {r["data"]["status"]} ✓')
r = api('PUT', f'/api/move-tasks/{mtid}/execute', dt, {'action':'complete'})
print(f'Step8 完成移箱: {r["data"]["status"]} ✓')

r = api('GET', f'/api/containers/{cid}', gt)
cstatus = r['data']['container']['status'] if 'container' in r['data'] else r['data']['status']
print(f'Step9 容器最终状态: {cstatus} ✓')

print('=== 正常单全流程通过 ===')
