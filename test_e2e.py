import httpx

b = "http://127.0.0.1:8001"
OK = True

def check(label, expected, actual):
    global OK
    if expected != actual:
        print(f"  FAIL {label}: expected={expected} actual={actual}")
        OK = False
    else:
        print(f"  OK   {label}: {actual}")

print("=== Test 1: Startup - seed data auto-generated alerts ===")
plans = httpx.get(b + "/api/immunization/plans").json()
by_status = {}
for p in plans:
    by_status.setdefault(p["plan_status"], []).append(p["id"])
check("completed plans", 4, len(by_status.get("已完成", [])))
check("pending plans", 3, len(by_status.get("待执行", [])))
check("overdue plans", 3, len(by_status.get("已逾期", [])))

alerts = httpx.get(b + "/api/alerts/").json()
overdue_alert_ids = sorted(set(
    a["related_record_id"] for a in alerts
    if a["alert_type"] == "逾期未执行" and a["alert_status"] == "待处理"
))
overdue_plan_ids = sorted(by_status.get("已逾期", []))
check("overdue match", overdue_plan_ids, overdue_alert_ids)

ov = httpx.get(b + "/api/dashboard/overview").json()
imm = ov["immunization"]
check("dashboard completed", 4, imm["completed_plans"])
check("dashboard truly_overdue", 3, imm["truly_overdue_plans"])

print("\n=== Test 2: MISSED execution -> missed alert stays ACTIVE ===")
r = httpx.post(b + "/api/immunization/executions", json={
    "plan_id": 8, "batch_id": 5,
    "execution_date": "2026-06-10", "executor": "张繁育",
    "actual_dose": 1.0, "result": "漏打",
    "reason": "3头仔猪体弱未接种", "head_count_executed": 42,
})
check("missed exec created", 200, r.status_code)

alerts = httpx.get(b + "/api/alerts/").json()
missed_alerts = [a for a in alerts if a["related_record_id"] == 8 and a["alert_type"] == "漏打疫苗"]
check("missed alert count", 1, len(missed_alerts))
check("missed alert ACTIVE", "待处理", missed_alerts[0]["alert_status"] if missed_alerts else "NONE")
check("missed detail has 待补打", True, "待补打" in missed_alerts[0]["detail"] if missed_alerts else False)

plan8 = next(p for p in httpx.get(b + "/api/immunization/plans").json() if p["id"] == 8)
check("plan 8 stays OVERDUE (missed pigs not yet made up)", "已逾期", plan8["plan_status"])

print("\n=== Test 3: MAKEUP -> missed alert resolved, makeup alert created ===")
r = httpx.post(b + "/api/immunization/executions", json={
    "plan_id": 8, "batch_id": 5,
    "execution_date": "2026-06-12", "executor": "张繁育",
    "actual_dose": 1.0, "result": "补打",
    "reason": "3头体弱仔猪恢复后补打", "head_count_executed": 3,
})
check("makeup exec created", 200, r.status_code)

alerts = httpx.get(b + "/api/alerts/").json()
missed_alerts = [a for a in alerts if a["related_record_id"] == 8 and a["alert_type"] == "漏打疫苗"]
makeup_alerts = [a for a in alerts if a["related_record_id"] == 8 and a["alert_type"] == "补打疫苗"]
check("missed alert RESOLVED", "已解决", missed_alerts[0]["alert_status"] if missed_alerts else "NONE")
check("makeup alert exists", True, len(makeup_alerts) > 0)

print("\n=== Test 4: Final consistency ===")
plans = httpx.get(b + "/api/immunization/plans").json()
by_status = {}
for p in plans:
    by_status.setdefault(p["plan_status"], []).append(p["id"])
ov = httpx.get(b + "/api/dashboard/overview").json()
imm = ov["immunization"]
check("completed match", len(by_status.get("已完成",[])), imm["completed_plans"])
check("pending match", len(by_status.get("待执行",[])), imm["pending_plans"])
check("overdue match", len(by_status.get("已逾期",[])), imm["truly_overdue_plans"])

alerts = httpx.get(b + "/api/alerts/").json()
overdue_alert_ids = set(a["related_record_id"] for a in alerts if a["alert_type"] == "逾期未执行" and a["alert_status"] == "待处理")
overdue_plan_ids = set(by_status.get("已逾期", []))
check("overdue alerts match plans", overdue_plan_ids, overdue_alert_ids)

print(f"\n{'ALL TESTS PASSED' if OK else 'SOME TESTS FAILED'}")
