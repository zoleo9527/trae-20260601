import urllib.request
import json

BASE = 'http://localhost:8080/api'

def api(path, method='GET', data=None, token=None):
    url = BASE + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read())
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': json.loads(e.read().decode())}

def login(username):
    res = api('/auth/login', 'POST', {'username': username, 'password': '123456'})
    return res['data']['token']

pm_token = login('pm')

surveys = api('/surveys', token=pm_token)

# 测试提交
pending = [s for s in surveys['data'] if s['status'] == 'PENDING']
if pending:
    sid = pending[0]['id']
    print(f'📝 测试勘察单 #{sid}: {pending[0]["projectName"]}')
    print(f'   当前状态: {pending[0]["status"]}')
    
    submit_res = api(f'/surveys/{sid}/submit', 'POST', {'remark': '测试提交备注'}, token=pm_token)
    if 'error' not in submit_res:
        print(f'   ✅ 提交成功，新状态: {submit_res["data"]["status"]}')
    else:
        print(f'   ❌ 提交失败: {submit_res["body"]["message"]}')

# 测试卡住和解除
in_progress = [s for s in surveys['data'] if s['status'] == 'IN_PROGRESS']
if in_progress:
    sid2 = in_progress[0]['id']
    print(f'\n🔴 测试卡住勘察单 #{sid2}: {in_progress[0]["projectName"]}')
    
    stuck_res = api(f'/surveys/{sid2}/stuck', 'POST', {'reason': '测试-客户资料不全'}, token=pm_token)
    if 'error' not in stuck_res:
        print(f'   ✅ 标记卡住成功，状态: {stuck_res["data"]["status"]}')
        print(f'   ✅ 卡住原因: {stuck_res["data"]["stuckReason"]}')
    else:
        print(f'   ❌ 标记卡住失败: {stuck_res["body"]["message"]}')
    
    unstick_res = api(f'/surveys/{sid2}/unstick', 'POST', {'remark': '资料已补齐'}, token=pm_token)
    if 'error' not in unstick_res:
        print(f'   ✅ 解除卡住成功，状态: {unstick_res["data"]["status"]}')
    else:
        print(f'   ❌ 解除卡住失败: {unstick_res["body"]["message"]}')

# 测试方案单操作
plans = api('/plans', token=pm_token)
pending_plans = [p for p in plans['data'] if p['status'] == 'PENDING']
if pending_plans:
    pid = pending_plans[0]['id']
    print(f'\n📋 测试方案单 #{pid}: {pending_plans[0]["projectName"]}')
    
    plan_submit = api(f'/plans/{pid}/submit', 'POST', {'remark': '方案已完善'}, token=pm_token)
    if 'error' not in plan_submit:
        print(f'   ✅ 提交成功，状态: {plan_submit["data"]["status"]}')
    else:
        print(f'   ❌ 提交失败: {plan_submit["body"]["message"]}')

print('\n✅ 操作链路测试完成')
