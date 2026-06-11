import urllib.request, json

BASE = 'http://localhost:8080/api'

def api(p, m='GET', d=None, t=None):
    h = {'Content-Type':'application/json'}
    if t: h['Authorization']='Bearer '+t
    b = json.dumps(d).encode() if d else None
    try:
        r = urllib.request.urlopen(urllib.request.Request(BASE+p,data=b,headers=h,method=m))
        return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {'err':e.code,'m':json.loads(e.read().decode())}

def login(u):
    return api('/auth/login','POST',{'username':u,'password':'123456'})['data']['token']

t = login('pm')

OK = '✅'; FAIL='❌'

print('=== Nuxt 页面断点 4 项修复后端端到端验证 ===\n')

# 1
r = api('/dashboard/stuck', t=t)
d = r.get('data',{})
keys = ['totalStuckSurveys','stuckSurveys','totalStuckPlans','stuckPlans']
check1 = all(k in d for k in keys) and isinstance(d['stuckSurveys'],list) and isinstance(d['stuckPlans'],list)
print(f'{OK if check1 else FAIL} ① index.vue: /dashboard/stuck 结构正确 ({len(d["stuckSurveys"])} 勘察, {len(d["stuckPlans"])} 方案)')

# 2
surveys_all = api('/surveys', t=t)['data']
sid = surveys_all[0]['id']
uid = 2
r = api(f'/surveys/{sid}/assign','PATCH',{'assignedToId':uid},t=t)
check2 = r.get('data',{}).get('assignedTo',{}).get('id') == uid
print(f'{OK if check2 else FAIL} ② surveys/[id].vue: /assign PATCH 成功 (处理人 id={uid})')

# 3
plans_all = api('/plans', t=t)['data']
pid = plans_all[0]['id']
r = api(f'/plans/{pid}/assign','PATCH',{'assignedToId':3},t=t)
check3 = r.get('data',{}).get('assignedTo',{}).get('id') == 3
print(f'{OK if check3 else FAIL} ③ plans/[id].vue: /assign PATCH 成功 (处理人 id=3)')

# 4
surveys = api('/surveys',t=t)['data']
app = [x for x in surveys if x['status']=='APPROVED']
check4 = False
if app:
    r = api(f'/plans/survey/{app[0]["id"]}', t=t)
    d = r.get('data',None)
    check4 = isinstance(d, list)
    # 模拟前端取值逻辑
    related = d[0] if (isinstance(d,list) and d) else d
    id4 = related.get('id') if related else None
    print(f'{OK if check4 else FAIL} ④ /plans/survey/:id 返回数组 √, 取 [0].id={id4}')
else:
    print('⚠️  无已通过勘察单，跳过 ④')

print('\n=== 全部修复验证完成 ===')
