import urllib.request
import json

def api(method, path, data=None, uid='u003'):
    url = f'http://localhost:3005/api{path}'
    headers = {'Content-Type': 'application/json', 'X-User-Id': uid}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print("=== 1. 初始状态 i001（灭火器过期）===")
d = api('GET', '/inspections/i001')
print(f"  状态: {d['status']} (应为 dispatched)")
print(f"  预计完成: {d['dispatches'][0]['expectedCompletionTime']}")
print(f"  整改备注: {d['dispatches'][0]['rectificationRemark']}")
print(f"  最后流转: {d['statusLogs'][-1]['toStatus']} - {d['statusLogs'][-1]['remark']}")

print("\n=== 2. 设置预计完成时间（状态应保持 dispatched）===")
api('PUT', '/dispatches/d001', {'expectedCompletionTime': '2026-06-08 17:00:00', 'rectificationRemark': '物业已收到通知'})
d = api('GET', '/inspections/i001')
print(f"  状态: {d['status']} (应为 dispatched)")
print(f"  新预计完成: {d['dispatches'][0]['expectedCompletionTime']}")
print(f"  整改备注: {d['dispatches'][0]['rectificationRemark']}")
print(f"  最后流转: {d['statusLogs'][-1]['toStatus']} - {d['statusLogs'][-1]['remark']}")

print("\n=== 3. 开始整改（状态应变 in_progress）===")
api('PUT', '/dispatches/d001', {'isStarted': True, 'rectificationRemark': '已联系维保公司更换灭火器'})
d = api('GET', '/inspections/i001')
print(f"  状态: {d['status']} (应为 in_progress)")
print(f"  整改备注: {d['dispatches'][0]['rectificationRemark']}")
print(f"  最后流转: {d['statusLogs'][-1]['toStatus']} - {d['statusLogs'][-1]['remark']}")

print("\n=== 4. 提交整改完成（状态应变为 pending_review_after）===")
api('PUT', '/dispatches/d001', {'isCompleted': True, 'rectificationRemark': '灭火器已更换为全新MFZ/ABC4型，压力正常'})
d = api('GET', '/inspections/i001')
print(f"  状态: {d['status']} (应为 pending_review_after)")
print(f"  整改备注: {d['dispatches'][0]['rectificationRemark']}")
print(f"  流转记录:")
for log in d['statusLogs']:
    print(f"    {log['timestamp']} | {log['fromStatus']}→{log['toStatus']} | {log['operatorName']}: {log['remark']}")
