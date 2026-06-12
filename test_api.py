import requests
import json

BASE_URL = "http://localhost:8000/api"

# 1. 登录
print("=== 1. 登录 ===")
login_data = {"username": "zhangsan", "password": "123456"}
r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print(f"登录状态: {r.status_code}")
token = r.json()["access_token"]
print(f"用户: {r.json()['real_name']}, 角色: {r.json()['role']}")
headers = {"Authorization": f"Bearer {token}"}

# 2. 获取房源列表
print("\n=== 2. 获取房源列表 ===")
r = requests.get(f"{BASE_URL}/properties", headers=headers, params={"page_size": 5})
data = r.json()
print(f"共 {data['total']} 条房源")
for p in data["items"]:
    print(f"  ID:{p['id']} {p['property_no']} - {p['building']} {p['floor']} {p['room_no']} | 状态:{p['status']} | 备注:{str(p.get('remarks',''))[:40]}")

# 3. 测试房源空置处理（更新备注）
print("\n=== 3. 测试房源空置处理 ===")
property_id = data["items"][0]["id"]
old_remarks = data["items"][0].get("remarks", "")
vacancy_data = {
    "status": "vacant",
    "vacancy_reason": "合同到期客户退租",
    "remarks": "【测试更新】装修保持良好，带看前请联系物业开门。\n注意：门锁已更换，新钥匙在前台。"
}
r = requests.put(f"{BASE_URL}/properties/{property_id}/vacancy", json=vacancy_data, headers=headers)
print(f"更新状态: {r.status_code}")
updated = r.json()
print(f"更新后备注: {updated.get('remarks', '')[:80]}")
print(f"责任人: {updated.get('handler_name', '')}, 更新时间: {updated.get('updated_at', '')}")

# 4. 测试创建带看时自动继承房源备注
print("\n=== 4. 测试创建带看（继承房源备注） ===")
from datetime import datetime, timedelta
viewing_date = (datetime.now() + timedelta(days=1)).isoformat()
viewing_data = {
    "property_id": property_id,
    "customer_name": "测试客户",
    "customer_phone": "13800000000",
    "viewing_date": viewing_date,
    "remarks": "客户需要300㎡左右办公空间",
    "inherit_property_remarks": True
}
r = requests.post(f"{BASE_URL}/viewings", json=viewing_data, headers=headers)
print(f"创建带看状态: {r.status_code}")
viewing = r.json()
print(f"带看ID: {viewing['id']}, 客户: {viewing['customer_name']}")
print(f"带看备注（含继承）: {viewing.get('remarks', '')[:150]}")
print(f"房源备注同步显示: {viewing.get('property_info', {}).get('remarks', '')[:80]}")

# 5. 获取房源操作追溯
print("\n=== 5. 获取房源操作追溯 ===")
r = requests.get(f"{BASE_URL}/properties/{property_id}/timeline", headers=headers)
timeline = r.json()
print(f"共 {len(timeline)} 条操作记录")
for log in timeline[:3]:
    print(f"  [{log['created_at']}] {log['operation_type']} - {log['operator_name']}")
    if log.get("remarks"):
        print(f"    备注: {log['remarks'][:60]}")

# 6. 获取交班摘要
print("\n=== 6. 获取交班摘要 ===")
r = requests.get(f"{BASE_URL}/handover/summary", headers=headers, params={"hours": 24})
summary = r.json()
print(f"空置房源: {summary['stats']['vacant_count']}")
print(f"今日待带看: {summary['stats']['today_viewing_count']}")
print(f"待处理异常: {summary['stats']['pending_exception_count']}")
print(f"近期变更: {summary['stats']['recent_change_count']}")

# 7. 生成交班单
print("\n=== 7. 生成交班单 ===")
shift_start = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0).isoformat()
shift_end = datetime.now().replace(hour=18, minute=0, second=0, microsecond=0).isoformat()
handover_data = {
    "shift_start": shift_start,
    "shift_end": shift_end,
    "outgoing_remarks": "当班一切正常，重点关注A-1501房源带看安排"
}
r = requests.post(f"{BASE_URL}/handover/records", json=handover_data, headers=headers)
print(f"生成交班单状态: {r.status_code}")
record = r.json()
print(f"交班单ID: {record['id']}, 状态: {record['status']}")
print(f"空置: {record['vacant_count']}, 待带看: {record['pending_viewing_count']}, 待异常: {record['pending_exception_count']}")

# 8. 获取交班单快照
print("\n=== 8. 获取交班单快照 ===")
r = requests.get(f"{BASE_URL}/handover/records/{record['id']}/snapshot", headers=headers)
snapshot = r.json()
print(f"快照包含空置房源: {len(snapshot.get('vacant_properties', []))} 套")
print(f"快照包含待带看: {len(snapshot.get('pending_viewings', []))} 组")
print(f"快照包含待异常: {len(snapshot.get('pending_exceptions', []))} 条")
print(f"交班人: {snapshot['record_info']['outgoing_user_name']}")
print(f"交班备注: {snapshot['record_info']['outgoing_remarks']}")

print("\n✅ 所有API测试通过！")
