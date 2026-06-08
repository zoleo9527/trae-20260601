from database import SessionLocal, engine, Base
import models
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── 用户 ──
users_data = [
    {"username": "tech", "name": "张技术", "role": "technician", "hashed_password": "123456"},
    {"username": "warehouse", "name": "李仓管", "role": "warehouse", "hashed_password": "123456"},
    {"username": "manager", "name": "王场长", "role": "manager", "hashed_password": "123456"},
]
for u in users_data:
    existing = db.query(models.User).filter(models.User.username == u["username"]).first()
    if not existing:
        db.add(models.User(**u))
db.commit()

# ── 投喂计划 ──
plans_data = [
    {
        "plan_no": "FP-20260601-001", "pond_no": "A1", "breed_type": "草鱼",
        "feed_type": "配合饲料A", "daily_amount": 50.0, "frequency": 3,
        "start_date": "2026-06-01", "end_date": "2026-06-30",
        "status": "approved", "created_by": "张技术", "remark": "A1塘口夏季投喂",
    },
    {
        "plan_no": "FP-20260601-002", "pond_no": "B2", "breed_type": "鲤鱼",
        "feed_type": "配合饲料B", "daily_amount": 35.0, "frequency": 2,
        "start_date": "2026-06-01", "end_date": "2026-06-30",
        "status": "submitted", "created_by": "张技术", "remark": "B2塘口夏季投喂",
    },
    {
        "plan_no": "FP-20260602-001", "pond_no": "C3", "breed_type": "鲫鱼",
        "feed_type": "配合饲料C", "daily_amount": 25.0, "frequency": 2,
        "start_date": "2026-06-02", "end_date": "2026-07-02",
        "status": "draft", "created_by": "张技术", "remark": "C3塘口新计划待确认",
    },
    {
        "plan_no": "FP-20260603-001", "pond_no": "A2", "breed_type": "草鱼",
        "feed_type": "配合饲料A", "daily_amount": 45.0, "frequency": 3,
        "start_date": "2026-06-03", "end_date": "2026-07-03",
        "status": "rejected", "created_by": "张技术", "remark": "A2塘口投喂计划",
    },
]
for p in plans_data:
    existing = db.query(models.FeedingPlan).filter(models.FeedingPlan.plan_no == p["plan_no"]).first()
    if not existing:
        db.add(models.FeedingPlan(**p))
db.commit()

# ── 投喂计划状态日志 ──
plan_logs = [
    # FP-20260601-001: draft -> submitted -> approved
    {"feeding_plan_id": 1, "from_status": "", "to_status": "draft", "operator": "张技术", "operator_role": "technician", "remark": "创建投喂计划"},
    {"feeding_plan_id": 1, "from_status": "draft", "to_status": "submitted", "operator": "张技术", "operator_role": "technician", "remark": "提交审核"},
    {"feeding_plan_id": 1, "from_status": "submitted", "to_status": "approved", "operator": "王场长", "operator_role": "manager", "remark": "审核通过，按计划执行"},
    # FP-20260601-002: draft -> submitted
    {"feeding_plan_id": 2, "from_status": "", "to_status": "draft", "operator": "张技术", "operator_role": "technician", "remark": "创建投喂计划"},
    {"feeding_plan_id": 2, "from_status": "draft", "to_status": "submitted", "operator": "张技术", "operator_role": "technician", "remark": "提交审核，等待场长确认"},
    # FP-20260602-001: draft only
    {"feeding_plan_id": 3, "from_status": "", "to_status": "draft", "operator": "张技术", "operator_role": "technician", "remark": "新建草稿，尚未提交"},
    # FP-20260603-001: draft -> submitted -> rejected
    {"feeding_plan_id": 4, "from_status": "", "to_status": "draft", "operator": "张技术", "operator_role": "technician", "remark": "创建投喂计划"},
    {"feeding_plan_id": 4, "from_status": "draft", "to_status": "submitted", "operator": "张技术", "operator_role": "technician", "remark": "提交审核"},
    {"feeding_plan_id": 4, "from_status": "submitted", "to_status": "rejected", "operator": "王场长", "operator_role": "manager", "remark": "配比不合理，请调整后重新提交"},
]
base_time = datetime(2026, 6, 1, 9, 0, 0)
for i, log in enumerate(plan_logs):
    log["operated_at"] = base_time + timedelta(hours=i * 2)
    existing = db.query(models.StatusLog).filter(
        models.StatusLog.feeding_plan_id == log.get("feeding_plan_id"),
        models.StatusLog.to_status == log["to_status"],
        models.StatusLog.operator == log["operator"],
    ).first()
    if not existing:
        db.add(models.StatusLog(**log))
db.commit()

# ── 饲料领用 ──
reqs_data = [
    {
        "req_no": "FR-20260601-001", "feeding_plan_id": 1, "pond_no": "A1",
        "feed_type": "配合饲料A", "amount": 200.0, "status": "received",
        "requested_by": "张技术", "issued_by": "李仓管", "received_by": "张技术",
        "remark": "A1塘口6月首批饲料",
    },
    {
        "req_no": "FR-20260602-001", "feeding_plan_id": 1, "pond_no": "A1",
        "feed_type": "配合饲料A", "amount": 150.0, "status": "issued",
        "requested_by": "张技术", "issued_by": "李仓管", "received_by": "",
        "remark": "A1塘口6月第二批饲料",
    },
    {
        "req_no": "FR-20260603-001", "feeding_plan_id": 1, "pond_no": "A1",
        "feed_type": "配合饲料A", "amount": 100.0, "status": "pending",
        "requested_by": "张技术", "issued_by": "", "received_by": "",
        "remark": "A1塘口6月第三批饲料",
    },
]
for r in reqs_data:
    existing = db.query(models.FeedRequisition).filter(models.FeedRequisition.req_no == r["req_no"]).first()
    if not existing:
        db.add(models.FeedRequisition(**r))
db.commit()

# ── 饲料领用状态日志 ──
req_logs = [
    # FR-20260601-001: pending -> issued -> received
    {"feed_requisition_id": 1, "from_status": "", "to_status": "pending", "operator": "张技术", "operator_role": "technician", "remark": "申请领用饲料"},
    {"feed_requisition_id": 1, "from_status": "pending", "to_status": "issued", "operator": "李仓管", "operator_role": "warehouse", "remark": "确认发料，已出库200kg"},
    {"feed_requisition_id": 1, "from_status": "issued", "to_status": "received", "operator": "张技术", "operator_role": "technician", "remark": "确认收料，数量无误"},
    # FR-20260602-001: pending -> issued
    {"feed_requisition_id": 2, "from_status": "", "to_status": "pending", "operator": "张技术", "operator_role": "technician", "remark": "申请领用饲料"},
    {"feed_requisition_id": 2, "from_status": "pending", "to_status": "issued", "operator": "李仓管", "operator_role": "warehouse", "remark": "确认发料，已出库150kg"},
    # FR-20260603-001: pending only
    {"feed_requisition_id": 3, "from_status": "", "to_status": "pending", "operator": "张技术", "operator_role": "technician", "remark": "申请领用饲料，等待仓管确认"},
]
base_time2 = datetime(2026, 6, 1, 14, 0, 0)
for i, log in enumerate(req_logs):
    log["operated_at"] = base_time2 + timedelta(hours=i * 3)
    existing = db.query(models.StatusLog).filter(
        models.StatusLog.feed_requisition_id == log.get("feed_requisition_id"),
        models.StatusLog.to_status == log["to_status"],
        models.StatusLog.operator == log["operator"],
    ).first()
    if not existing:
        db.add(models.StatusLog(**log))
db.commit()

print("Seed data initialized successfully")
print(f"  Users: {db.query(models.User).count()}")
print(f"  FeedingPlans: {db.query(models.FeedingPlan).count()}")
print(f"  FeedRequisitions: {db.query(models.FeedRequisition).count()}")
print(f"  StatusLogs: {db.query(models.StatusLog).count()}")
db.close()
