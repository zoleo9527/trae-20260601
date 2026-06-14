# -*- coding: utf-8 -*-
import urllib.request, json
BASE = 'http://localhost:5174'

def post(order_id, payload):
    req = urllib.request.Request(
        f'{BASE}/api/orders/{order_id}/transition',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

# 订单2 OVERDUE_CONFIRMED -> 库管封签破损 -> OVERDUE_PENDING
r = post(2, {
    "action": "REJECT_TO_APPRAISER", "role": "STORAGE", "roleName": "王库管",
    "notes": "fengqian posun",
    "abnormalTrigger": {"key":"SEAL_BROKEN","label":"封签破损","alertMessage":"fengqian yichang","severity":"critical"}
})
print('Order2:', r['order']['current_status'])

# 订单3 STORAGE_CHECKED -> 财务证件缺失 -> OVERDUE_CONFIRMED
r = post(3, {
    "action": "REJECT_TO_STORAGE", "role": "FINANCE", "roleName": "陈财务",
    "notes": "zhengjian queshi",
    "abnormalTrigger": {"key":"DOC_MISSING","label":"证件/证书缺失","alertMessage":"ziliao buquan","severity":"medium"}
})
print('Order3:', r['order']['current_status'])

# 订单5 CUSTOMER_NOTIFIED -> 客户申诉 -> FINANCIAL_SETTLED
r = post(5, {
    "action": "APPEAL_REVERT_SETTLED", "role": "APPRAISER", "roleName": "李评估",
    "notes": "kehu shensu",
    "abnormalTrigger": {"key":"CUSTOMER_APPEAL_NOTIFIED","label":"客户申诉（已通知）","alertMessage":"kehu shensu","severity":"high"}
})
print('Order5:', r['order']['current_status'])

# 订单4 FINANCIAL_SETTLED -> 评估师金额异议 -> STORAGE_CHECKED
r = post(4, {
    "action": "REJECT_TO_FINANCE", "role": "APPRAISER", "roleName": "李评估",
    "notes": "jine buyi",
    "abnormalTrigger": {"key":"AMOUNT_MISMATCH","label":"核算金额不符","alertMessage":"jine yiyi","severity":"medium"}
})
print('Order4:', r['order']['current_status'])

print('\n--- all abnormal orders ---')
resp = urllib.request.urlopen(f'{BASE}/api/orders?abnormal=1')
for o in json.loads(resp.read()):
    abn = o['last_abnormal']
    print(f"{o['order_no']}: {abn['abnormal_label']}({abn['abnormal_severity']}) from:{abn['returned_from_name']} now:{o['current_status']}")
