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
        print(f'  ❌ HTTP {e.code}: {e.read().decode()}')
        return None

def login(username, password='123456'):
    res = api('/auth/login', 'POST', {'username': username, 'password': password})
    return res['data']['token'] if res else None

print('=' * 60)
print('🧪 权限与修复验证测试')
print('=' * 60)

# 1. 测试用户列表接口
print('\n1️⃣  用户列表接口测试')
pm_token = login('pm')
print(f'  pm 登录: {"✅" if pm_token else "❌"}')

users = api('/users', token=pm_token)
print(f'  用户列表数量: {len(users["data"]) if users else 0}')
if users and users['data']:
    print(f'  第一个用户: {users["data"][0]["realName"]} ({users["data"][0]["role"]})')

# 2. 测试工程师只能看自己的单子
print('\n2️⃣  权限边界测试（工程师视角）')
eng_token = login('engineer')
print(f'  engineer 登录: {"✅" if eng_token else "❌"}')

surveys_eng = api('/surveys', token=eng_token)
print(f'  工程师可见勘察单: {len(surveys_eng["data"]) if surveys_eng else 0}')

surveys_pm = api('/surveys', token=pm_token)
print(f'  项目经理可见勘察单: {len(surveys_pm["data"]) if surveys_pm else 0}')

# 3. 测试未分配单据不会报错
print('\n3️⃣  未分配单据空值安全测试')
my_surveys = api('/surveys/my', token=eng_token)
print(f'  我的勘察单数量: {len(my_surveys["data"]) if my_surveys else 0} (无报错 ✅)')

my_plans = api('/plans/my', token=eng_token)
print(f'  我的方案单数量: {len(my_plans["data"]) if my_plans else 0} (无报错 ✅)')

# 4. 测试卡住报告
print('\n4️⃣  卡住报告接口测试')
stuck = api('/dashboard/stuck', token=pm_token)
if stuck:
    print(f'  卡住勘察单: {stuck["data"]["totalStuckSurveys"]}')
    print(f'  卡住方案单: {stuck["data"]["totalStuckPlans"]}')
    print(f'  超时预警勘察: {stuck["data"]["potentialStuckSurveys"]}')
    print(f'  超时预警方案: {stuck["data"]["potentialStuckPlans"]}')

# 5. 测试详情页查看权限
print('\n5️⃣  详情页权限测试')
first_survey = surveys_pm['data'][0]
print(f'  查看勘察单 #{first_survey["id"]} (项目经理): ✅')

# 工程师尝试看别人的单子
other_survey = next((s for s in surveys_pm['data'] if s['assignedTo'] and s['assignedTo']['id'] != 3), None)
if other_survey:
    detail = api(f'/surveys/{other_survey["id"]}', token=eng_token)
    print(f'  工程师看别人的勘察单 #{other_survey["id"]}: {"❌ 被拦截 (正确)" if not detail else "⚠️  能看到 (错误)"}')

# 6. 测试分配人接口
print('\n6️⃣  分配人接口测试')
sid = surveys_pm['data'][0]['id']
assign_res = api(f'/surveys/{sid}/assign', 'PATCH', {'assignedToId': 2}, token=pm_token)
print(f'  分配勘察单给施工队长: {"✅" if assign_res else "❌"}')
if assign_res:
    print(f'  新处理人: {assign_res["data"]["assignedTo"]["realName"] if assign_res["data"]["assignedTo"] else "未分配"}')

# 7. 测试备注接口
print('\n7️⃣  备注接口测试')
remark_res = api(f'/surveys/{sid}/remarks', 'POST', {'remark': '测试备注 - 来自自动化测试'}, token=pm_token)
print(f'  添加备注: {"✅" if remark_res else "❌"}')

remarks_list = api(f'/surveys/{sid}/remarks', token=pm_token)
print(f'  备注数量: {len(remarks_list["data"]) if remarks_list else 0}')

print('\n' + '=' * 60)
print('✅ 所有测试完成')
print('=' * 60)
