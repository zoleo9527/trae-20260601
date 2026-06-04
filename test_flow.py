#!/usr/bin/env python3
import subprocess
import json
import sys

def curl(method, path, token=None, body=None):
    cmd = ["curl", "-s", f"http://localhost:3001{path}", "-X", method]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

def login(username, password):
    r = curl("POST", "/api/auth/login", body={"username": username, "password": password})
    return r["data"]["token"]

print("=== 1. 登录咨询师 ===")
cons_token = login("consultant", "demo123")
print("  ✓ 登录成功")

print("\n=== 2. 查看 apt2 初始状态 ===")
d = curl("GET", "/api/appointments/apt2", cons_token)["data"]
print(f"  预约状态: {d['appointment']['status']}")
for s in d["confirmationSteps"]:
    print(f"    步骤{s['step']}: {s['label']} | 角色:{s['role']} | 状态:{s['status']}")

print("\n=== 3. 咨询师确认步骤1 ===")
r = curl("POST", "/api/plans/confirmation-step/s2_1", cons_token, {"note": "方案已提交，客户初步认可"})
if r["success"]:
    apt = r["data"]["appointment"]
    print(f"  ✓ 成功！预约状态: {apt['status']}")
    for s in r["data"]["steps"]:
        print(f"    步骤{s['step']}: {s['label']} | 状态:{s['status']}")
else:
    print(f"  ✗ 失败: {r.get('error')}")
    sys.exit(1)

print("\n=== 4. 助理登录 ===")
assist_token = login("assistant", "demo123")
print("  ✓ 登录成功")

print("\n  4a. 助理尝试确认步骤1（应该被拒绝）:")
r = curl("POST", "/api/plans/confirmation-step/s2_1", assist_token, {})
if not r["success"]:
    print(f"    ✓ 正确拒绝: {r.get('error')}")
else:
    print("    ✗ 错误：应该失败但成功了")
    sys.exit(1)

print("\n  4b. 助理确认步骤2（应该成功）:")
r = curl("POST", "/api/plans/confirmation-step/s2_2", assist_token, {"note": "方案确认无误"})
if r["success"]:
    apt = r["data"]["appointment"]
    print(f"    ✓ 成功！预约状态: {apt['status']}")
    for s in r["data"]["steps"]:
        print(f"      步骤{s['step']}: {s['label']} | 状态:{s['status']}")
else:
    print(f"    ✗ 失败: {r.get('error')}")
    sys.exit(1)

print("\n=== 5. 客服登录并确认步骤3 ===")
svc_token = login("service", "demo123")
print("  ✓ 登录成功")

r = curl("POST", "/api/plans/confirmation-step/s2_3", svc_token, {"note": "已归档，流程结束"})
if r["success"]:
    apt = r["data"]["appointment"]
    print(f"  ✓ 成功！预约状态: {apt['status']}")
    print(f"    allCompleted: {r['data']['allCompleted']}")
    for s in r["data"]["steps"]:
        note = f' ("{s["note"]}")' if s["note"] else ""
        print(f"    步骤{s['step']}: {s['label']} | 状态:{s['status']}{note}")
else:
    print(f"  ✗ 失败: {r.get('error')}")
    sys.exit(1)

print("\n=== 6. 验证废弃的直接状态更新接口 ===")
r = curl("PATCH", "/api/appointments/apt2/status", cons_token, {"status": "completed"})
if not r["success"]:
    print(f"  ✓ 正确拒绝: {r.get('error')}")
else:
    print("  ✗ 错误：应该被拒绝")
    sys.exit(1)

print("\n" + "="*50)
print("🎉 所有测试通过！状态机工作正常")
print("="*50)
