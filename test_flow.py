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

print("=== 1. 查看 apt4（孙晓燕）初始状态（pending） ===")
cons_token = login("consultant", "demo123")
d = curl("GET", "/api/appointments/apt4", cons_token)["data"]
print(f"  预约状态: {d['appointment']['status']}")
print(f"  当前步骤: {[s for s in d['confirmationSteps'] if s['status'] == 'current'][0]['label']}")
for s in d["confirmationSteps"]:
    print(f"    步骤{s['step']}: {s['label']} | 角色:{s['role']} | 状态:{s['status']}")

print("\n=== 2. 咨询师确认步骤1（接待）→ 状态 in_consultation ===")
r = curl("POST", "/api/plans/confirmation-step/apt4_1", cons_token, {"note": "客户已到店，开始咨询"})
if r["success"]:
    apt = r["data"]["appointment"]
    current = [s for s in r["data"]["steps"] if s["status"] == "current"][0]
    print(f"  ✓ 成功！预约状态: {apt['status']}")
    print(f"    下一步: {current['label']}")
else:
    print(f"  ✗ 失败: {r.get('error')}")
    sys.exit(1)

print("\n=== 3. 咨询师确认步骤2（提交方案）→ 状态 plan_submitted ===")
r = curl("POST", "/api/plans/confirmation-step/apt4_2", cons_token, {"note": "方案已提交，客户初步认可"})
if r["success"]:
    apt = r["data"]["appointment"]
    current = [s for s in r["data"]["steps"] if s["status"] == "current"][0]
    print(f"  ✓ 成功！预约状态: {apt['status']}")
    print(f"    下一步: {current['label']}")
else:
    print(f"  ✗ 失败: {r.get('error')}")
    sys.exit(1)

print("\n=== 4. 医生助理确认步骤3（方案确认）→ 状态 plan_confirmed ===")
assist_token = login("assistant", "demo123")
r = curl("POST", "/api/plans/confirmation-step/apt4_3", assist_token, {"note": "方案确认无误"})
if r["success"]:
    apt = r["data"]["appointment"]
    current = [s for s in r["data"]["steps"] if s["status"] == "current"][0]
    print(f"  ✓ 成功！预约状态: {apt['status']}")
    print(f"    下一步: {current['label']}")
else:
    print(f"  ✗ 失败: {r.get('error')}")
    sys.exit(1)

print("\n=== 5. 客服确认步骤4（归档）→ 状态 completed ===")
svc_token = login("service", "demo123")
r = curl("POST", "/api/plans/confirmation-step/apt4_4", svc_token, {"note": "已归档，流程结束"})
if r["success"]:
    apt = r["data"]["appointment"]
    print(f"  ✓ 成功！预约状态: {apt['status']}")
    print(f"    allCompleted: {r['data']['allCompleted']}")
else:
    print(f"  ✗ 失败: {r.get('error')}")
    sys.exit(1)

print("\n=== 6. 验证跳步操作被拒绝（尝试确认步骤1，应该失败）===")
r = curl("POST", "/api/plans/confirmation-step/apt4_1", cons_token, {})
if not r["success"]:
    print(f"  ✓ 正确拒绝: {r.get('error')}")
else:
    print("  ✗ 错误：应该失败但成功了")
    sys.exit(1)

print("\n" + "="*60)
print("🎉 4步完整流程测试通过！")
print("  pending → in_consultation → plan_submitted → plan_confirmed → completed")
print("="*60)
