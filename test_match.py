import json
import urllib.request
import urllib.error

BASE = "http://localhost:8080/api"
HEADERS = {"X-User-ID": "6", "Content-Type": "application/json"}

def req(path, method="GET", data=None):
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(BASE + path, data=body, method=method, headers=HEADERS)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

print("=== 1. 初始状态 ===")
shift = req("/shifts/6")["data"]
print(f"  班结{shift['shift_no']}: 状态={shift['status']}")
cash = req("/cash/4")["data"]
print(f"  现金CV0004: 状态={cash['status']} 申报={cash['cash_declared']}")

print("\n=== 2. 提交盘点结果（少300元，制造差异） ===")
r = req("/cash/4/submit_count", "POST", {"cash_counted": 8790})
print(f"  现金新状态: {r['data']['status']}")

print("\n=== 3. 盘点后班结状态 ===")
shift = req("/shifts/6")["data"]
print(f"  班结状态: {shift['status']}  (预期: pending_cash)")

print("\n=== 4. 执行手工匹配 (match) ===")
r = req("/cash/4/match", "POST", {})
print(f"  现金新状态: {r['data']['status']}")

print("\n=== 5. 关键验证：match后班结状态 ===")
shift = req("/shifts/6")["data"]
print(f"  班结状态: {shift['status']}")
print(f"  审核人: {shift.get('approved_by_name', '(空)')}")

if shift["status"] == "approved":
    print("  ✅ 修复成功！手工匹配后班结自动闭环")
else:
    print("  ❌ 状态断点未修复！")

print("\n=== 6. 班结操作日志（验证 auto_close 记录） ===")
logs = req("/logs?ref_type=shift_settlement&ref_id=6")["data"]
found_auto_close = False
for l in logs:
    old = l.get("old_status") or "-"
    new = l.get("new_status") or "-"
    print(f"  {l['action']:12s} {old:12s} → {new:12s}  by {l['operator_name']}")
    if l["action"] == "auto_close":
        found_auto_close = True
        if l.get("detail"):
            print(f"    详情: {l['detail']}")

if found_auto_close:
    print("\n  ✅ 操作日志同步：auto_close 记录已写入")
else:
    print("\n  ❌ 操作日志不同步：缺少 auto_close 记录")

print("\n=== 7. 现金核对操作日志 ===")
logs = req("/logs?ref_type=cash_verification&ref_id=4")["data"]
for l in logs:
    old = l.get("old_status") or "-"
    new = l.get("new_status") or "-"
    print(f"  {l['action']:15s} {old:12s} → {new:12s}  by {l['operator_name']}")
