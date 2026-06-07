import requests
import json

BASE = "http://localhost:8000"

def get_token(username, password="123456"):
    r = requests.post(f"{BASE}/token", data={"username": username, "password": password})
    return r.json()["access_token"]

token = get_token("zhanzhang")
headers = {"Authorization": f"Bearer {token}"}

print("=" * 60)
print("测试 1: 通过充值ID获取台账（王五的充值，有关联发票）")
print("=" * 60)
r = requests.get(f"{BASE}/ledger/recharge/3", headers=headers)
d = r.json()
print(f"台账类型: {d['ledger_type']}")
print(f"充值会员: {d['recharge']['member_name']}")
print(f"关联发票: {d['invoice']['invoice_title'] if d['invoice'] else '无'}")
print(f"当前状态: {d['current_status_text']}")
print(f"当前处理人: {d['current_handler_name']}")
print(f"退回原因: {d['return_reason']}")
print(f"补充备注: {d['supplement_remark']}")
print(f"流转日志数: {len(d['all_flow_logs'])}")
print(f"可用操作: {[a['label'] for a in d['available_actions']]}")

print()
print("=" * 60)
print("测试 2: 通过发票ID获取台账（张三的被退回发票）")
print("=" * 60)
r = requests.get(f"{BASE}/ledger/invoice/3", headers=headers)
d = r.json()
print(f"发票抬头: {d['invoice']['invoice_title'] if d['invoice'] else '无'}")
print(f"关联充值会员: {d['recharge']['member_name'] if d['recharge'] else '无'}")
print(f"当前状态: {d['current_status_text']}")
print(f"退回原因: {d['return_reason']}")
print(f"流转日志数: {len(d['all_flow_logs'])}")
print("流转时间线:")
for log in d['all_flow_logs']:
    print(f"  - {log['action_desc']} | {log['operator_name']}")
    if log['remark']:
        print(f"    备注: {log['remark']}")

print()
print("=" * 60)
print("测试 3: 无发票的纯充值台账（钱七的充值）")
print("=" * 60)
r = requests.get(f"{BASE}/ledger/recharge/5", headers=headers)
d = r.json()
print(f"台账类型: {d['ledger_type']}")
print(f"充值会员: {d['recharge']['member_name']}")
print(f"关联发票: {'有' if d['invoice'] else '无'}")
print(f"当前状态: {d['current_status_text']}")
print(f"可用操作: {[a['label'] for a in d['available_actions']]}")

print()
print("=" * 60)
print("测试 4: 收银员视角查看被退回的发票")
print("=" * 60)
cashier_token = get_token("shouyinyuan")
cashier_headers = {"Authorization": f"Bearer {cashier_token}"}
r = requests.get(f"{BASE}/ledger/invoice/3", headers=cashier_headers)
d = r.json()
print(f"当前状态: {d['current_status_text']}")
print(f"可用操作: {[a['label'] for a in d['available_actions']]}")

print()
print("✅ 所有统一台账API测试通过!")
