import httpx

base = "http://127.0.0.1:8000"

plans = httpx.get(base + "/api/immunization/plans").json()
overdue = [p for p in plans if p["plan_status"] == "已逾期"]
completed = [p for p in plans if p["plan_status"] == "已完成"]
pending = [p for p in plans if p["plan_status"] == "待执行"]
print("Plans: completed=%d pending=%d overdue=%d" % (len(completed), len(pending), len(overdue)))

alerts = httpx.get(base + "/api/alerts/").json()
active_overdue = [a for a in alerts if a["alert_type"] == "逾期未执行" and a["alert_status"] == "待处理"]
print("Active overdue alerts: %d" % len(active_overdue))

overdue_plan_ids = set(p["id"] for p in overdue)
alert_plan_ids = set(a["related_record_id"] for a in active_overdue)
print("Plan IDs match alerts: %s" % (overdue_plan_ids == alert_plan_ids))

overview = httpx.get(base + "/api/dashboard/overview").json()
imm = overview["immunization"]
print(
    "Dashboard: completed=%d pending=%d truly_overdue=%d missed=%d makeup=%d delayed=%d"
    % (
        imm["completed_plans"],
        imm["pending_plans"],
        imm["truly_overdue_plans"],
        imm["missed_executions"],
        imm["makeup_executions"],
        imm["delayed_executions"],
    )
)
print("All 3 interfaces consistent: %s" % (
    imm["completed_plans"] == len(completed)
    and imm["pending_plans"] == len(pending)
    and imm["truly_overdue_plans"] == len(overdue)
    and len(overdue) == len(active_overdue)
))
