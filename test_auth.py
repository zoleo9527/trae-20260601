import urllib.request, json

def api(method, path, cookie=None, body=None):
    data = json.dumps(body).encode() if body else b''
    req = urllib.request.Request(f'http://localhost:3000{path}', data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    if cookie:
        req.add_header('Cookie', cookie)
    try:
        resp = urllib.request.urlopen(req)
        return resp.getcode(), json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

api('POST', '/api/reset', 'current_user_id=m1')

print('=== 1. 主管创建记录(应403) ===')
code, body = api('POST', '/api/acceptance', 'current_user_id=d1',
    {'enterpriseName':'test','contractNo':'C1','floor':'A','roomNumber':'1','area':100,'contractDate':'2026-01-01','plannedMoveInDate':'2026-02-01'})
print(f'  code={code} msg={body.get("statusMessage","")}')

print('=== 2. 工程师创建记录(应403) ===')
code, body = api('POST', '/api/acceptance', 'current_user_id=e1',
    {'enterpriseName':'test','contractNo':'C1','floor':'A','roomNumber':'1','area':100,'contractDate':'2026-01-01','plannedMoveInDate':'2026-02-01'})
print(f'  code={code} msg={body.get("statusMessage","")}')

print('=== 3. 经理尝试主管审核(应403) ===')
code, body = api('POST', '/api/acceptance/acc_002/director', 'current_user_id=m1',
    {'result':'pass','feeStartDate':'2026-03-01'})
print(f'  code={code} msg={body.get("statusMessage","")}')

print('=== 4. 经理尝试工程师验收(应403) ===')
code, body = api('POST', '/api/acceptance/acc_001/engineer', 'current_user_id=m1',
    {'result':'pass','engineerRemark':'ok'})
print(f'  code={code} msg={body.get("statusMessage","")}')

print('=== 5. 工程师尝试提交(应403) ===')
code, body = api('POST', '/api/acceptance/acc_001/submit', 'current_user_id=e1')
print(f'  code={code} msg={body.get("statusMessage","")}')

print('=== 6. 主管尝试重新提交(应403) ===')
code, body = api('POST', '/api/acceptance/acc_006/resubmit', 'current_user_id=d1')
print(f'  code={code} msg={body.get("statusMessage","")}')

print('=== 7. 未登录访问(应401) ===')
code, body = api('GET', '/api/acceptance')
print(f'  code={code} msg={body.get("statusMessage","")}')

print('=== 8. 主管审核(正常) ===')
code, body = api('POST', '/api/reset', 'current_user_id=d1')
print(f'  reset: code={code}')
code, body = api('POST', '/api/acceptance/acc_002/director', 'current_user_id=d1',
    {'result':'pass','feeStartDate':'2026-03-01','directorRemark':'confirmed'})
print(f'  code={code} status={body.get("status","FAIL")} directorName={body.get("directorName","N/A")} msg={body.get("statusMessage","")}')

print('=== 9. 工程师验收(正常) ===')
api('POST', '/api/reset', 'current_user_id=e1')
code, body = api('POST', '/api/acceptance/acc_001/engineer', 'current_user_id=e1',
    {'result':'pass','engineerRemark':'现场合格'})
print(f'  code={code} status={body.get("status","FAIL")} engineerName={body.get("engineerName","N/A")} msg={body.get("statusMessage","")}')

print('=== 10. 经理创建(正常) ===')
code, body = api('POST', '/api/acceptance', 'current_user_id=m1',
    {'enterpriseName':'测试企业','contractNo':'C1','floor':'A','roomNumber':'1','area':100,'contractDate':'2026-01-01','plannedMoveInDate':'2026-02-01'})
print(f'  code={code} id={body.get("id","FAIL")} managerId={body.get("managerId","N/A")}')

print('\nAll tests done!')
