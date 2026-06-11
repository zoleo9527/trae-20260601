#!/usr/bin/env python3
import requests
import json

BASE = "http://localhost:5174"

def test(name, expected_ok, fn):
    try:
        result = fn()
        ok = result.get('success', False) if isinstance(result, dict) else False
        status = "✅ PASS" if (ok == expected_ok) else "❌ FAIL"
        print(f"{status} {name}")
        if ok != expected_ok:
            print(f"   预期: {'成功' if expected_ok else '失败'}")
            print(f"   实际: {result.get('error', result.get('success', result))}")
        return result
    except Exception as e:
        print(f"❌ FAIL {name}: {e}")
        return None

print("=" * 60)
print("消防维保系统 - 状态流转与签收链路测试")
print("=" * 60)

# 测试1: transition接口禁止直接流转到signed
test(
    "禁止 transition 接口直接从 pending_signature → signed",
    False,
    lambda: requests.post(f"{BASE}/api/reports/2/transition", json={
        "to_status": "signed",
        "operator_id": 4,
        "remark": "绕过sign接口"
    }).json()
)

# 测试2: 伪造operator角色 (inspector伪装成supervisor审核)
test(
    "伪造 operator_role 无效 — 巡检工程师不能审核报告",
    False,
    lambda: requests.post(f"{BASE}/api/reports/3/transition", json={
        "to_status": "report_approved",
        "operator_id": 1,
        "operator_role": "supervisor",
        "remark": "伪造角色"
    }).json()
)

# 测试3: 非对应物业提异议
test(
    "非对应物业联系人不能提异议 — 王芳（阳光花园）不能对金茂大厦提异议",
    False,
    lambda: requests.post(f"{BASE}/api/reports/2/transition", json={
        "to_status": "disputed",
        "operator_id": 3,
        "remark": "王芳的异议"
    }).json()
)

# 测试4: 对应物业提异议 - 应该成功
result4 = test(
    "对应物业联系人可以提异议 — 陈静（金茂大厦）对报告2提异议",
    True,
    lambda: requests.post(f"{BASE}/api/reports/2/transition", json={
        "to_status": "disputed",
        "operator_id": 4,
        "remark": "陈静异议：灭火器数量与实际不符，请核实"
    }).json()
)

# 测试5: 异议后责任人是维保主管
if result4 and result4.get('success'):
    new_status = result4.get('new_status', {})
    ok = new_status.get('responsible_role') == 'supervisor'
    print(f"{'✅ PASS' if ok else '❌ FAIL'} 异议状态责任人是维保主管")
    if not ok:
        print(f"   实际: {new_status.get('responsible_role')}")

# 测试6: sign接口伪造signatory_name无效
# 先把状态从异议退回到待签收
requests.post(f"{BASE}/api/reports/2/transition", json={
    "to_status": "pending_signature",
    "operator_id": 5,
    "remark": "主管处理完毕，退回待签收"
})

result6 = test(
    "sign 接口伪造 signatory_name 无效",
    True,
    lambda: requests.post(f"{BASE}/api/reports/2/sign", json={
        "signatory_id": 4,
        "signatory_name": "我是伪造的名字",
        "remark": "测试伪造名字"
    }).json()
)

if result6 and result6.get('success'):
    sig_name = result6.get('signature', {}).get('signatory_name')
    ok = sig_name == '陈静' and sig_name != '我是伪造的名字'
    print(f"{'✅ PASS' if ok else '❌ FAIL'} 签名姓名取数据库值，忽略请求体伪造")
    if not ok:
        print(f"   期望: 陈静")
        print(f"   实际: {sig_name}")

# 测试7: 最终时间线验证
resp = requests.get(f"{BASE}/api/reports/2")
data = resp.json()
transitions = data.get('transitions', [])
signatures = data.get('signatures', [])

print()
print("=" * 60)
print(f"最终时间线（共 {len(transitions)} 条流转，{len(signatures)} 条签收）")
print("-" * 60)
for t in transitions:
    time_str = t['transition_time'][11:16]
    print(f"  [{time_str}] {t['operator_role_label']}·{t['operator_name']}  →  {t['to_status_label']}")
    if t.get('remark'):
        print(f"         备注: {t['remark'][:40]}...")

print()
print("=" * 60)
print("测试完成")
