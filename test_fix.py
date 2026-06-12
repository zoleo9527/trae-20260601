import requests
import json

BASE_URL = "http://localhost:8000/api"

# 1. 登录
print("=== 1. 登录 ===")
login_data = {"username": "zhangsan", "password": "123456"}
r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
token = r.json()["access_token"]
print(f"用户: {r.json()['real_name']}")
headers = {"Authorization": f"Bearer {token}"}

# 2. 获取一个异常记录
print("\n=== 2. 获取异常记录 ===")
r = requests.get(f"{BASE_URL}/exceptions", headers=headers, params={"page_size": 2, "status": "pending"})
exceptions = r.json()["items"]
exc = exceptions[0]
print(f"异常ID: {exc['id']}, 标题: {exc['title']}, 状态: {exc['status']}")
print(f"原备注: {exc.get('remarks', '(空)')}")
print(f"原严重程度: {exc.get('severity')}")

# 3. 测试更新异常（测试全字段更新）
print("\n=== 3. 测试更新异常 - 全字段更新 ===")
update_data = {
    "title": exc["title"] + "（已更新）",
    "description": exc["description"] + "\n补充：经过进一步排查，问题原因已确认。",
    "severity": "high" if exc["severity"] != "high" else "normal",
    "remarks": "【更新测试】备注已更新，处理进度：已联系物业工程部门，明天上午上门维修。",
    "solution": "初步方案：更换空调滤网，加雪种。如仍不行则检查压缩机。",
    "status": "processing"
}
r = requests.put(f"{BASE_URL}/exceptions/{exc['id']}", json=update_data, headers=headers)
print(f"更新状态: {r.status_code}")
updated = r.json()
print(f"更新后标题: {updated['title']}")
print(f"更新后状态: {updated['status']}")
print(f"更新后严重程度: {updated['severity']}")
print(f"更新后解决方案: {updated.get('solution', '')[:50]}")
print(f"更新后备注: {updated.get('remarks', '')}")
print(f"责任人: {updated.get('handler_name', '')}")

# 4. 查看操作追溯
print("\n=== 4. 查看异常操作追溯 ===")
r = requests.get(f"{BASE_URL}/exceptions/{exc['id']}/timeline", headers=headers)
timeline = r.json()
print(f"共 {len(timeline)} 条操作记录")
for log in timeline:
    print(f"  [{log['created_at']}] {log['operation_type']} - {log['operator_name']}")
    if log.get("remarks"):
        print(f"    备注: {log['remarks'][:80]}")
    if log.get("new_value"):
        print(f"    新值: {log['new_value'][:80]}")

# 5. 测试状态变更为 resolved（自动设置 resolved_at）
print("\n=== 5. 测试状态变更为已解决 ===")
resolve_data = {
    "status": "resolved",
    "solution": "已更换空调滤网并添加雪种，制冷效果恢复正常。客户满意。",
    "remarks": "维修完成，费用已从物业费中扣除。"
}
r = requests.put(f"{BASE_URL}/exceptions/{exc['id']}", json=resolve_data, headers=headers)
print(f"更新状态: {r.status_code}")
resolved = r.json()
print(f"状态: {resolved['status']}")
print(f"解决时间: {resolved.get('resolved_at', 'N/A')}")
print(f"解决方案: {resolved.get('solution', '')}")

# 6. 再次查看操作追溯
print("\n=== 6. 再次查看追溯 ===")
r = requests.get(f"{BASE_URL}/exceptions/{exc['id']}/timeline", headers=headers)
timeline = r.json()
for log in timeline[:2]:
    print(f"  [{log['created_at']}] {log['operation_type']} - {log['operator_name']}")
    if log.get("remarks"):
        print(f"    备注: {log['remarks'][:100]}")

print("\n✅ 异常更新接口测试通过！")
