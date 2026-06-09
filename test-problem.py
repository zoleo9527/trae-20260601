import urllib.request, json, sys

def api(method, path, token=None, data=None):
    url = 'http://localhost:3001' + path
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print('=== 问题单流程测试 ===')

r = api('POST', '/api/auth/login', data={'username':'service01','password':'service01'})
st = r['data']['token']
print(f'Step1 客服登录: {r["data"]["name"]}({r["data"]["role"]}) ✓')

r = api('POST', '/api/problems/detect', st, {})
total = r.get('meta',{}).get('totalDetected',0)
new = r.get('meta',{}).get('newCount',0)
print(f'Step2 运行检测: 发现{total}个问题, 新增{new}个 ✓')

r = api('GET', '/api/problems?status=open', st)
problems = r['data']
print(f'Step3 问题单列表: {len(problems)}条 ✓')

misplaced = [p for p in problems if p['type'] == 'misplaced']
if misplaced:
    pid = misplaced[0]['id']
    r = api('PUT', f'/api/problems/{pid}/action', st, {'action':'reschedule','data':{'planned_at':'2026-06-12T09:00:00'},'remark':'客户要求延期'})
    print(f'Step4 改期操作: ID={pid}, 状态={r["data"]["status"]} ✓')

stuck = [p for p in problems if p['type'] == 'stuck_inspecting' and p['status'] == 'open']
if stuck:
    pid = stuck[0]['id']
    r = api('PUT', f'/api/problems/{pid}/action', st, {'action':'supplement','data':{'note':'查验设备故障已修复'},'remark':'补充说明'})
    print(f'Step5 补录操作: ID={pid}, 状态={r["data"]["status"]} ✓')

stuck_move = [p for p in problems if p['type'] == 'stuck_move' and p['status'] == 'open']
if not stuck_move:
    stuck_move = [p for p in problems if p['type'] == 'no_inspection' and p['status'] == 'open']
if stuck_move:
    pid = stuck_move[0]['id']
    r = api('PUT', f'/api/problems/{pid}/action', st, {'action':'reject','data':{},'remark':'误报'})
    print(f'Step6 驳回操作: ID={pid}, 状态={r["data"]["status"]} ✓')

if stuck:
    pid = stuck[0]['id']
    r = api('PUT', f'/api/problems/{pid}/resolve', st)
    print(f'Step7 标记解决: ID={pid}, 状态={r["data"]["status"]} ✓')

r = api('GET', '/api/problems?size=20', st)
by_status = {}
for p in r['data']:
    by_status.setdefault(p['status'], []).append(p)
print(f'Step8 问题单状态分布: {", ".join(f"{k}:{len(v)}" for k,v in by_status.items())} ✓')

r = api('GET', '/api/logs?size=5', st)
print(f'Step9 操作日志: 共{r["data"]["total"]}条 ✓')
for l in r['data']['list'][:3]:
    print(f'  {l["created_at"][:16]} [{l["role"]}] {l["action"]}: {l["detail"][:40]}')

print('=== 问题单流程通过 ===')
