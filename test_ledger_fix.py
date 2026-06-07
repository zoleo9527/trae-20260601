import requests
import json

BASE = "http://localhost:8000"

def get_token(username, password="123456"):
    r = requests.post(f"{BASE}/token", data={"username": username, "password": password})
    return r.json()["access_token"]

token = get_token("zhanzhang")
headers = {"Authorization": f"Bearer {token}"}

print("=" * 70)
print("🎯 场景 1: 充值待审核 + 有待开发票 → 应优先显示【充值环节】")
print("=" * 70)
r = requests.get(f"{BASE}/ledger/recharge/5", headers=headers)  # 钱七: pending + 有发票
d = r.json()
print(f"  当前环节: {d['current_stage']}")
print(f"  当前状态: {d['current_status_text']}")
print(f"  充值状态: {d['recharge_status_text']}")
print(f"  发票状态: {d['invoice_status_text']}")
print(f"  可用操作: {[a['label'] for a in d['available_actions']]}")
assert d['current_stage'] == 'recharge', "❌ 应优先显示充值环节"
print("✅ 正确：充值未完成时优先显示充值环节")

print()
print("=" * 70)
print("🎯 场景 2: 充值已审核待确认 + 有发票 → 应显示【充值环节】")
print("=" * 70)
r = requests.get(f"{BASE}/ledger/recharge/2", headers=headers)  # 李四: verified + 有发票
d = r.json()
print(f"  当前环节: {d['current_stage']}")
print(f"  当前状态: {d['current_status_text']}")
print(f"  充值状态: {d['recharge_status_text']}")
print(f"  发票状态: {d['invoice_status_text']}")
print(f"  可用操作: {[a['label'] for a in d['available_actions']]}")
assert d['current_stage'] == 'recharge', "❌ 应显示充值环节"
print("✅ 正确：充值待确认时仍显示充值环节")

print()
print("=" * 70)
print("🎯 场景 3: 充值已到账 + 发票处理中 → 应切换到【发票环节】")
print("=" * 70)
r = requests.get(f"{BASE}/ledger/recharge/2", headers=headers)  # 先确认李四已到账？不对，李四是verified
r = requests.get(f"{BASE}/ledger/recharge/3", headers=headers)  # 王五: confirmed + 发票completed
d = r.json()
print(f"  当前环节: {d['current_stage']}")
print(f"  当前状态: {d['current_status_text']}")
print(f"  充值状态: {d['recharge_status_text']}")
print(f"  发票状态: {d['invoice_status_text']}")
print(f"  站长处理备注: {d['manager_process_remark']}")
print(f"  可用操作: {[a['label'] for a in d['available_actions']]}")
assert d['current_stage'] == 'invoice', "❌ 充值完成后应显示发票环节"
print("✅ 正确：充值到账后切换到发票环节")

print()
print("=" * 70)
print("🎯 场景 4: 充值待审核 + 发票被退回 → 优先显示充值环节（逻辑正确）")
print("=" * 70)
r = requests.get(f"{BASE}/ledger/invoice/3", headers=headers)  # 张三: 充值pending + 发票returned
d = r.json()
print(f"  当前环节: {d['current_stage']}")
print(f"  当前状态: {d['current_status_text']}")
print(f"  充值状态: {d['recharge_status_text']}")
print(f"  发票状态: {d['invoice_status_text']}")
print(f"  站长退回原因: {d['manager_return_reason']}")
print(f"  收银员补充: {d['cashier_supplement_remark']}")
print(f"  站长处理备注: {d['manager_process_remark']}")
assert d['manager_return_reason'] is not None, "❌ 应该有站长退回原因"
assert d['current_stage'] == 'recharge', "❌ 充值未完成应优先显示充值环节"
print("✅ 正确：充值未完成时，即使有发票也优先显示充值环节")
print("✅ 正确：退回原因单独显示，与充值状态区分")

print()
print("=" * 70)
print("🎯 场景 5: 收银员视角查看被退回发票 → 只能看到补充操作")
print("=" * 70)
cashier_token = get_token("shouyinyuan")
cashier_headers = {"Authorization": f"Bearer {cashier_token}"}
r = requests.get(f"{BASE}/ledger/invoice/3", headers=cashier_headers)
d = r.json()
print(f"  当前环节: {d['current_stage']}")
print(f"  当前状态: {d['current_status_text']}")
print(f"  站长退回原因: {d['manager_return_reason']}")
print(f"  可用操作: {[a['label'] for a in d['available_actions']]}")
assert len(d['available_actions']) == 1, "❌ 收银员只能有一个操作"
assert '补充信息重新提交' in d['available_actions'][0]['label'], "❌ 应该是补充操作"
print("✅ 正确：收银员视角只能看到补充操作")

print()
print("=" * 70)
print("🎯 场景 6: 充值已驳回 → 显示充值环节和站长处理备注")
print("=" * 70)
r = requests.get(f"{BASE}/ledger/recharge/4", headers=headers)  # 赵六: rejected
d = r.json()
print(f"  当前环节: {d['current_stage']}")
print(f"  当前状态: {d['current_status_text']}")
print(f"  充值状态: {d['recharge_status_text']}")
print(f"  站长处理备注: {d['manager_process_remark']}")
print(f"  可用操作: {[a['label'] for a in d['available_actions']]}")
assert d['current_stage'] == 'recharge', "❌ 应显示充值环节"
print("✅ 正确：驳回的充值仍在充值环节展示")

print()
print("🎉 所有场景验证通过！责任摘要断点已修复")
