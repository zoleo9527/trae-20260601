import urllib.request
import urllib.error
import json

BASE = 'http://localhost:5174'

def get_order(order_id):
    resp = urllib.request.urlopen(f'{BASE}/api/orders/{order_id}')
    return json.loads(resp.read())

def post_transition(order_id, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f'{BASE}/api/orders/{order_id}/transition',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        resp = urllib.request.urlopen(req)
        return True, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return False, json.loads(raw)
        except:
            return False, {'message': raw.decode('utf-8', errors='replace')[:200]}

def print_flow(order_id, label):
    d = get_order(order_id)
    print(f'\n=== {label} ===')
    print(f'  单号: {d["order"]["order_no"]}')
    print(f'  当前状态: {d["order"]["current_status"]}')
    print(f'  流转链:')
    for t in d['transitions']:
        mark = ' [异常]' if t.get('is_abnormal') else ''
        label = f' - {t["abnormal_label"]}' if t.get('abnormal_label') else ''
        sev = f' ({t["abnormal_severity"]})' if t.get('abnormal_severity') else ''
        print(f'    {t["from_status"]} → {t["to_status"]}{mark}{label}{sev}')

print_flow(2, '场景1: 库管 → 封签破损 → 退回评估师 (OVERDUE_CONFIRMED → OVERDUE_PENDING)')

print_flow(3, '场景2: 财务 → 证件缺失 → 退回库管 (STORAGE_CHECKED → OVERDUE_CONFIRMED)')

print_flow(5, '场景3: 评估师 → 客户申诉(已通知) → 退回结算 (CUSTOMER_NOTIFIED → FINANCIAL_SETTLED)')

# 场景4: 安全测试 - 异常操作不传 abnormalTrigger 应该拒绝
print('\n=== 场景4: 安全测试 - 异常操作不传 abnormalTrigger ===')
d = get_order(3)
init_status = d['order']['current_status']
init_count = len(d['transitions'])
print(f'  订单3当前状态: {init_status}, 流转数: {init_count}')
print(f'  用 STORAGE 角色尝试 REJECT_TO_APPRAISER (异常动作)，但不传 abnormalTrigger')

ok, result = post_transition(3, {
    'action': 'REJECT_TO_APPRAISER',
    'role': 'STORAGE',
    'roleName': '王库管',
    'notes': '测试不传异常类型'
})
print(f'  调用结果: 成功={ok}')
print(f'  错误消息: {result.get("message", "无")}')

d = get_order(3)
after_status = d['order']['current_status']
after_count = len(d['transitions'])
print(f'  操作后状态: {after_status}, 流转数: {after_count}')
safe = (init_status == after_status) and (init_count == after_count)
print(f'  安全校验通过: {safe} (状态未变且流转数未增)')

# 场景5: 验证退回后能继续正常流转
print('\n=== 场景5: 异常退回后能否继续正常处理 ===')
print('  订单2当前在 OVERDUE_PENDING，由评估师处理，应能重新确认逾期')
ok, result = post_transition(2, {
    'action': 'CONFIRM_OVERDUE',
    'role': 'APPRAISER',
    'roleName': '李评估',
    'notes': '重新核价后确认逾期，客户已无异议。'
})
print(f'  重新确认逾期: 成功={ok}')
if ok:
    print(f'  新状态: {result["order"]["current_status"]}')
else:
    print(f'  错误: {result.get("message")}')

print_flow(2, '订单2 最终流转链 (验证异常→重新处理正常)')
print('\n✅ 全部测试完成')
