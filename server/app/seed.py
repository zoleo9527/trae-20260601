from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, PublicRepair, EngineeringDispatch, StatusLog,
    RepairStatus, DispatchStatus, RepairSource, UrgencyLevel, RoleType,
)
from .config import SLA_HOURS_REPAIR, SLA_HOURS_DISPATCH


def seed_data(db: Session):
    if db.query(User).first():
        return

    users = [
        User(username="ops1", display_name="张运营", role="operation", department="营运部", phone="13800000001"),
        User(username="ops2", display_name="李运营", role="operation", department="营运部", phone="13800000002"),
        User(username="service1", display_name="王客服", role="service_desk", department="客服台", phone="13800000003"),
        User(username="service2", display_name="赵客服", role="service_desk", department="客服台", phone="13800000004"),
        User(username="eng1", display_name="陈电气", role="engineering", department="工程部-电气", phone="13800000005"),
        User(username="eng2", display_name="刘水管", role="engineering", department="工程部-水管", phone="13800000006"),
        User(username="eng3", display_name="孙综合", role="engineering", department="工程部-综合", phone="13800000007"),
        User(username="admin", display_name="系统管理员", role="admin", department="管理部", phone="13800000000"),
    ]
    db.add_all(users)
    db.flush()

    now = datetime.now()

    repair1 = PublicRepair(
        repair_no="WX20260610001",
        title="1F大厅照明故障",
        description="1楼中庭主照明灯组闪烁，部分灯管不亮，影响顾客通行安全",
        location="1F中庭大厅",
        source=RepairSource.OPERATION.value,
        urgency=UrgencyLevel.URGENT.value,
        activity_occupation=False,
        tenant_timeout=False,
        complaint_ambiguous=False,
        status=RepairStatus.CLOSED.value,
        sla_deadline=now - timedelta(hours=20),
        reporter_id=users[0].id,
        handler_id=users[2].id,
        created_at=now - timedelta(hours=44),
        accepted_at=now - timedelta(hours=42),
        dispatched_at=now - timedelta(hours=41),
        completed_at=now - timedelta(hours=10),
        closed_at=now - timedelta(hours=2),
    )
    repair2 = PublicRepair(
        repair_no="WX20260610002",
        title="B1停车场消防管道漏水",
        description="B1层停车场A区消防管道接口处漏水，地面有积水",
        location="B1停车场A区",
        source=RepairSource.SERVICE_DESK.value,
        urgency=UrgencyLevel.EMERGENCY.value,
        activity_occupation=False,
        tenant_timeout=False,
        complaint_ambiguous=False,
        status=RepairStatus.IN_PROGRESS.value,
        sla_deadline=now + timedelta(hours=1),
        reporter_id=users[2].id,
        handler_id=users[3].id,
        created_at=now - timedelta(hours=3),
        accepted_at=now - timedelta(hours=2),
        dispatched_at=now - timedelta(hours=1.5),
    )
    repair3 = PublicRepair(
        repair_no="WX20260611001",
        title="3F卫生间水龙头损坏",
        description="3楼女卫生间第二个水龙头无法关闭，持续流水",
        location="3F女卫生间",
        source=RepairSource.TENANT.value,
        urgency=UrgencyLevel.NORMAL.value,
        activity_occupation=False,
        tenant_timeout=False,
        complaint_ambiguous=False,
        status=RepairStatus.PENDING.value,
        sla_deadline=now + timedelta(hours=48),
        reporter_id=users[1].id,
        created_at=now - timedelta(minutes=30),
    )
    repair4 = PublicRepair(
        repair_no="WX20260611002",
        title="活动占道导致电梯故障",
        description="周末促销活动搭建导致2号电梯门被卡，无法正常运行",
        location="2F活动区域-2号电梯",
        source=RepairSource.OPERATION.value,
        urgency=UrgencyLevel.URGENT.value,
        activity_occupation=True,
        activity_name="年中大促活动",
        tenant_timeout=False,
        complaint_ambiguous=False,
        status=RepairStatus.DISPATCHED.value,
        sla_deadline=now + timedelta(hours=20),
        reporter_id=users[0].id,
        handler_id=users[2].id,
        created_at=now - timedelta(hours=4),
        accepted_at=now - timedelta(hours=3),
        dispatched_at=now - timedelta(hours=2.5),
    )
    repair5 = PublicRepair(
        repair_no="WX20260611003",
        title="租户投诉空调不制冷归属不清",
        description="租户反馈空调不制冷，涉及物业管理与工程部职责划分不清",
        location="4F-405商铺",
        source=RepairSource.TENANT.value,
        urgency=UrgencyLevel.NORMAL.value,
        activity_occupation=False,
        tenant_timeout=True,
        complaint_ambiguous=True,
        complaint_ref="TS20260611001",
        status=RepairStatus.COMPLETED.value,
        sla_deadline=now + timedelta(hours=10),
        reporter_id=users[1].id,
        handler_id=users[3].id,
        created_at=now - timedelta(hours=38),
        accepted_at=now - timedelta(hours=36),
        dispatched_at=now - timedelta(hours=35),
        completed_at=now - timedelta(hours=5),
    )
    db.add_all([repair1, repair2, repair3, repair4, repair5])
    db.flush()

    dispatch1 = EngineeringDispatch(
        dispatch_no="GD20260610001",
        repair_id=repair1.id,
        work_content="更换1F中庭主照明灯组，检查电路接线",
        work_type="电气",
        estimated_hours=4.0,
        status=DispatchStatus.VERIFIED.value,
        sla_deadline=now - timedelta(hours=38),
        dispatcher_id=users[2].id,
        engineer_id=users[4].id,
        created_at=now - timedelta(hours=41),
        accepted_at=now - timedelta(hours=40),
        started_at=now - timedelta(hours=39),
        completed_at=now - timedelta(hours=10),
        verified_at=now - timedelta(hours=3),
        completion_note="已更换8根灯管，修复电路接线1处",
        material_usage="LED灯管x8, 电线5米",
    )
    dispatch2 = EngineeringDispatch(
        dispatch_no="GD20260610002",
        repair_id=repair2.id,
        work_content="紧急修复B1停车场消防管道漏水，更换密封垫",
        work_type="水管",
        estimated_hours=6.0,
        status=DispatchStatus.IN_PROGRESS.value,
        sla_deadline=now + timedelta(hours=2),
        dispatcher_id=users[3].id,
        engineer_id=users[5].id,
        created_at=now - timedelta(hours=1.5),
        accepted_at=now - timedelta(hours=1),
        started_at=now - timedelta(minutes=50),
    )
    dispatch4 = EngineeringDispatch(
        dispatch_no="GD20260611001",
        repair_id=repair4.id,
        work_content="修复2号电梯门卡顿问题，检查活动搭建影响",
        work_type="综合",
        estimated_hours=3.0,
        status=DispatchStatus.PENDING.value,
        sla_deadline=now + timedelta(hours=1.5),
        dispatcher_id=users[2].id,
        engineer_id=users[6].id,
        created_at=now - timedelta(hours=2.5),
    )
    dispatch5 = EngineeringDispatch(
        dispatch_no="GD20260611002",
        repair_id=repair5.id,
        work_content="排查空调不制冷原因，明确物业与工程部职责",
        work_type="空调",
        estimated_hours=4.0,
        status=DispatchStatus.COMPLETED.value,
        sla_deadline=now + timedelta(hours=8),
        dispatcher_id=users[3].id,
        engineer_id=users[4].id,
        created_at=now - timedelta(hours=35),
        accepted_at=now - timedelta(hours=34),
        started_at=now - timedelta(hours=33),
        completed_at=now - timedelta(hours=5),
        completion_note="空调压缩机故障已修复，补充冷媒",
        material_usage="冷媒R410A 2kg, 压缩机启动电容1个",
    )
    db.add_all([dispatch1, dispatch2, dispatch4, dispatch5])
    db.flush()

    logs = [
        StatusLog(repair_id=repair1.id, from_status=None, to_status="pending", operator_id=users[0].id, operator_name=users[0].display_name, operator_role="operation", remark="创建报修单", created_at=now - timedelta(hours=44)),
        StatusLog(repair_id=repair1.id, from_status="pending", to_status="accepted", operator_id=users[2].id, operator_name=users[2].display_name, operator_role="service_desk", remark="受理报修单", created_at=now - timedelta(hours=42)),
        StatusLog(repair_id=repair1.id, from_status="accepted", to_status="dispatched", operator_id=users[2].id, operator_name=users[2].display_name, operator_role="service_desk", remark="受理后自动派单", created_at=now - timedelta(hours=41)),
        StatusLog(dispatch_id=dispatch1.id, from_status=None, to_status="pending", operator_id=users[2].id, operator_name=users[2].display_name, operator_role="service_desk", remark="创建工程派单", created_at=now - timedelta(hours=41)),
        StatusLog(dispatch_id=dispatch1.id, from_status="pending", to_status="accepted", operator_id=users[4].id, operator_name=users[4].display_name, operator_role="engineering", remark="接单", created_at=now - timedelta(hours=40)),
        StatusLog(repair_id=repair1.id, from_status="dispatched", to_status="in_progress", operator_id=users[4].id, operator_name=users[4].display_name, operator_role="engineering", remark="工程师接单", created_at=now - timedelta(hours=40)),
        StatusLog(dispatch_id=dispatch1.id, from_status="in_progress", to_status="completed", operator_id=users[4].id, operator_name=users[4].display_name, operator_role="engineering", remark="完工", created_at=now - timedelta(hours=10)),
        StatusLog(repair_id=repair1.id, from_status="in_progress", to_status="completed", operator_id=users[4].id, operator_name=users[4].display_name, operator_role="engineering", remark="工程师完工", created_at=now - timedelta(hours=10)),
        StatusLog(dispatch_id=dispatch1.id, from_status="completed", to_status="verified", operator_id=users[0].id, operator_name=users[0].display_name, operator_role="operation", remark="验证完工", created_at=now - timedelta(hours=3)),
        StatusLog(repair_id=repair1.id, from_status="completed", to_status="closed", operator_id=users[0].id, operator_name=users[0].display_name, operator_role="operation", remark="关闭报修单", created_at=now - timedelta(hours=2)),

        StatusLog(repair_id=repair2.id, from_status=None, to_status="pending", operator_id=users[2].id, operator_name=users[2].display_name, operator_role="service_desk", remark="创建报修单", created_at=now - timedelta(hours=3)),
        StatusLog(repair_id=repair2.id, from_status="pending", to_status="accepted", operator_id=users[3].id, operator_name=users[3].display_name, operator_role="service_desk", remark="受理报修单", created_at=now - timedelta(hours=2)),
        StatusLog(repair_id=repair2.id, from_status="accepted", to_status="dispatched", operator_id=users[3].id, operator_name=users[3].display_name, operator_role="service_desk", remark="受理后自动派单", created_at=now - timedelta(hours=1.5)),
        StatusLog(dispatch_id=dispatch2.id, from_status=None, to_status="pending", operator_id=users[3].id, operator_name=users[3].display_name, operator_role="service_desk", remark="创建工程派单", created_at=now - timedelta(hours=1.5)),
        StatusLog(dispatch_id=dispatch2.id, from_status="pending", to_status="accepted", operator_id=users[5].id, operator_name=users[5].display_name, operator_role="engineering", remark="接单", created_at=now - timedelta(hours=1)),
        StatusLog(repair_id=repair2.id, from_status="dispatched", to_status="in_progress", operator_id=users[5].id, operator_name=users[5].display_name, operator_role="engineering", remark="工程师接单", created_at=now - timedelta(hours=1)),

        StatusLog(repair_id=repair3.id, from_status=None, to_status="pending", operator_id=users[1].id, operator_name=users[1].display_name, operator_role="operation", remark="创建报修单", created_at=now - timedelta(minutes=30)),

        StatusLog(repair_id=repair4.id, from_status=None, to_status="pending", operator_id=users[0].id, operator_name=users[0].display_name, operator_role="operation", remark="创建报修单", created_at=now - timedelta(hours=4)),
        StatusLog(repair_id=repair4.id, from_status="pending", to_status="accepted", operator_id=users[2].id, operator_name=users[2].display_name, operator_role="service_desk", remark="受理报修单", created_at=now - timedelta(hours=3)),
        StatusLog(repair_id=repair4.id, from_status="accepted", to_status="dispatched", operator_id=users[2].id, operator_name=users[2].display_name, operator_role="service_desk", remark="受理后自动派单", created_at=now - timedelta(hours=2.5)),
        StatusLog(dispatch_id=dispatch4.id, from_status=None, to_status="pending", operator_id=users[2].id, operator_name=users[2].display_name, operator_role="service_desk", remark="创建工程派单", created_at=now - timedelta(hours=2.5)),

        StatusLog(repair_id=repair5.id, from_status=None, to_status="pending", operator_id=users[1].id, operator_name=users[1].display_name, operator_role="operation", remark="创建报修单", created_at=now - timedelta(hours=38)),
        StatusLog(repair_id=repair5.id, from_status="pending", to_status="accepted", operator_id=users[3].id, operator_name=users[3].display_name, operator_role="service_desk", remark="受理报修单", created_at=now - timedelta(hours=36)),
        StatusLog(repair_id=repair5.id, from_status="accepted", to_status="dispatched", operator_id=users[3].id, operator_name=users[3].display_name, operator_role="service_desk", remark="受理后自动派单", created_at=now - timedelta(hours=35)),
        StatusLog(dispatch_id=dispatch5.id, from_status=None, to_status="pending", operator_id=users[3].id, operator_name=users[3].display_name, operator_role="service_desk", remark="创建工程派单", created_at=now - timedelta(hours=35)),
        StatusLog(dispatch_id=dispatch5.id, from_status="pending", to_status="accepted", operator_id=users[4].id, operator_name=users[4].display_name, operator_role="engineering", remark="接单", created_at=now - timedelta(hours=34)),
        StatusLog(repair_id=repair5.id, from_status="dispatched", to_status="in_progress", operator_id=users[4].id, operator_name=users[4].display_name, operator_role="engineering", remark="工程师接单", created_at=now - timedelta(hours=34)),
        StatusLog(dispatch_id=dispatch5.id, from_status="in_progress", to_status="completed", operator_id=users[4].id, operator_name=users[4].display_name, operator_role="engineering", remark="完工", created_at=now - timedelta(hours=5)),
        StatusLog(repair_id=repair5.id, from_status="in_progress", to_status="completed", operator_id=users[4].id, operator_name=users[4].display_name, operator_role="engineering", remark="工程师完工", created_at=now - timedelta(hours=5)),
    ]
    db.add_all(logs)
    db.commit()
