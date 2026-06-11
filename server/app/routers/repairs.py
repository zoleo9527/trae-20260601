import json
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session, joinedload

from ..config import SLA_HOURS_REPAIR, SLA_HOURS_DISPATCH
from ..database import get_db
from ..models import (
    PublicRepair, EngineeringDispatch, StatusLog, User,
    RepairStatus, DispatchStatus, UrgencyLevel, RepairSource,
)
from ..schemas import (
    RepairCreate, RepairResponse, RepairListResponse,
    RepairAcceptRequest, RepairCloseRequest, DispatchBriefResponse,
    StatusLogResponse,
)
from ..auth import get_current_user, require_role, RoleType

router = APIRouter(prefix="/api/repairs", tags=["公共报修"])


def _generate_repair_no(db: Session) -> str:
    today_str = datetime.now().strftime("%Y%m%d")
    prefix = f"WX{today_str}"
    last = (
        db.query(PublicRepair)
        .filter(PublicRepair.repair_no.like(f"{prefix}%"))
        .order_by(PublicRepair.repair_no.desc())
        .first()
    )
    if last:
        seq = int(last.repair_no[-3:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:03d}"


def _generate_dispatch_no(db: Session) -> str:
    today_str = datetime.now().strftime("%Y%m%d")
    prefix = f"GD{today_str}"
    last = (
        db.query(EngineeringDispatch)
        .filter(EngineeringDispatch.dispatch_no.like(f"{prefix}%"))
        .order_by(EngineeringDispatch.dispatch_no.desc())
        .first()
    )
    if last:
        seq = int(last.dispatch_no[-3:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:03d}"


def _repair_to_response(repair: PublicRepair, db: Session = None, include_relations: bool = False) -> RepairResponse:
    now = datetime.now()
    is_overdue = (
        repair.status not in (RepairStatus.COMPLETED.value, RepairStatus.CLOSED.value)
        and repair.sla_deadline
        and now > repair.sla_deadline
    )
    dispatch_resp = None
    status_logs_resp = []
    if include_relations:
        if repair.dispatch:
            d = repair.dispatch
            engineer_name = None
            dispatcher_name = None
            if db:
                if d.engineer_id:
                    eng = db.query(User).filter(User.id == d.engineer_id).first()
                    if eng:
                        engineer_name = eng.display_name
                if d.dispatcher_id:
                    disp = db.query(User).filter(User.id == d.dispatcher_id).first()
                    if disp:
                        dispatcher_name = disp.display_name
            actual_hours = None
            if d.started_at and d.completed_at:
                actual_hours = round((d.completed_at - d.started_at).total_seconds() / 3600, 2)
            dispatch_resp = DispatchBriefResponse(
                id=d.id,
                dispatch_no=d.dispatch_no,
                work_content=d.work_content,
                work_type=d.work_type,
                estimated_hours=d.estimated_hours,
                actual_hours=actual_hours,
                status=d.status,
                dispatcher_id=d.dispatcher_id,
                dispatcher_name=dispatcher_name,
                engineer_id=d.engineer_id,
                engineer_name=engineer_name,
                created_at=d.created_at,
                accepted_at=d.accepted_at,
                started_at=d.started_at,
                completed_at=d.completed_at,
                verified_at=d.verified_at,
                completion_note=d.completion_note,
                material_usage=d.material_usage,
            )
        if repair.status_logs:
            status_logs_resp = [
                StatusLogResponse(
                    id=sl.id,
                    repair_id=sl.repair_id,
                    dispatch_id=sl.dispatch_id,
                    from_status=sl.from_status,
                    to_status=sl.to_status,
                    operator_id=sl.operator_id,
                    operator_name=sl.operator_name,
                    operator_role=sl.operator_role,
                    remark=sl.remark,
                    created_at=sl.created_at,
                )
                for sl in repair.status_logs
            ]
    return RepairResponse(
        id=repair.id,
        repair_no=repair.repair_no,
        title=repair.title,
        description=repair.description,
        location=repair.location,
        source=repair.source,
        urgency=repair.urgency,
        activity_occupation=repair.activity_occupation,
        activity_name=repair.activity_name,
        tenant_timeout=repair.tenant_timeout,
        complaint_ambiguous=repair.complaint_ambiguous,
        complaint_ref=repair.complaint_ref,
        status=repair.status,
        sla_deadline=repair.sla_deadline,
        reporter_id=repair.reporter_id,
        handler_id=repair.handler_id,
        created_at=repair.created_at,
        accepted_at=repair.accepted_at,
        dispatched_at=repair.dispatched_at,
        completed_at=repair.completed_at,
        closed_at=repair.closed_at,
        is_overdue=is_overdue,
        dispatch=dispatch_resp,
        status_logs=status_logs_resp,
    )


VALID_REPAIR_TRANSITIONS = {
    RepairStatus.PENDING.value: [RepairStatus.ACCEPTED.value],
    RepairStatus.ACCEPTED.value: [RepairStatus.DISPATCHED.value],
    RepairStatus.DISPATCHED.value: [RepairStatus.IN_PROGRESS.value],
    RepairStatus.IN_PROGRESS.value: [RepairStatus.COMPLETED.value],
    RepairStatus.COMPLETED.value: [RepairStatus.CLOSED.value],
    RepairStatus.CLOSED.value: [],
}


@router.post("", response_model=RepairResponse, summary="创建报修单")
def create_repair(
    data: RepairCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.OPERATION.value, RoleType.SERVICE_DESK.value)),
):
    urgency_hours = {
        UrgencyLevel.NORMAL.value: SLA_HOURS_REPAIR,
        UrgencyLevel.URGENT.value: 24,
        UrgencyLevel.EMERGENCY.value: 4,
    }
    hours = urgency_hours.get(data.urgency.value, SLA_HOURS_REPAIR)
    sla_deadline = datetime.now() + timedelta(hours=hours)

    tenant_timeout = data.tenant_timeout
    if data.source == RepairSource.TENANT.value and data.urgency == UrgencyLevel.NORMAL.value:
        tenant_timeout = False

    repair = PublicRepair(
        repair_no=_generate_repair_no(db),
        title=data.title,
        description=data.description,
        location=data.location,
        source=data.source.value,
        urgency=data.urgency.value,
        activity_occupation=data.activity_occupation,
        activity_name=data.activity_name,
        tenant_timeout=tenant_timeout,
        complaint_ambiguous=data.complaint_ambiguous,
        complaint_ref=data.complaint_ref,
        status=RepairStatus.PENDING.value,
        sla_deadline=sla_deadline,
        reporter_id=current_user.id,
    )
    db.add(repair)
    db.flush()

    log = StatusLog(
        repair_id=repair.id,
        from_status=None,
        to_status=RepairStatus.PENDING.value,
        operator_id=current_user.id,
        operator_name=current_user.display_name,
        operator_role=current_user.role,
        remark="创建报修单",
    )
    db.add(log)
    db.commit()
    db.refresh(repair)
    return _repair_to_response(repair, db=db, include_relations=True)


@router.get("/timeout-warnings", response_model=list[RepairResponse], summary="超时预警列表")
def timeout_warnings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now()
    repairs = (
        db.query(PublicRepair)
        .filter(
            PublicRepair.status.notin_([RepairStatus.COMPLETED.value, RepairStatus.CLOSED.value]),
            PublicRepair.sla_deadline < now + timedelta(hours=4),
        )
        .options(joinedload(PublicRepair.dispatch), joinedload(PublicRepair.status_logs))
        .all()
    )
    return [_repair_to_response(r, db=db, include_relations=True) for r in repairs]


@router.get("", response_model=RepairListResponse, summary="报修单列表")
def list_repairs(
    status: Optional[str] = None,
    source: Optional[str] = None,
    urgency: Optional[str] = None,
    reporter_id: Optional[int] = None,
    handler_id: Optional[int] = None,
    activity_occupation: Optional[bool] = None,
    tenant_timeout: Optional[bool] = None,
    complaint_ambiguous: Optional[bool] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PublicRepair).options(
        joinedload(PublicRepair.dispatch), joinedload(PublicRepair.status_logs)
    )
    if status:
        query = query.filter(PublicRepair.status == status)
    if source:
        query = query.filter(PublicRepair.source == source)
    if urgency:
        query = query.filter(PublicRepair.urgency == urgency)
    if reporter_id:
        query = query.filter(PublicRepair.reporter_id == reporter_id)
    if handler_id:
        query = query.filter(PublicRepair.handler_id == handler_id)
    if activity_occupation is not None:
        query = query.filter(PublicRepair.activity_occupation == activity_occupation)
    if tenant_timeout is not None:
        query = query.filter(PublicRepair.tenant_timeout == tenant_timeout)
    if complaint_ambiguous is not None:
        query = query.filter(PublicRepair.complaint_ambiguous == complaint_ambiguous)
    if start_date:
        query = query.filter(PublicRepair.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(PublicRepair.created_at <= datetime.fromisoformat(end_date))

    total = query.count()
    items = (
        query.order_by(PublicRepair.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return RepairListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[_repair_to_response(r, db=db, include_relations=True) for r in items],
    )


@router.get("/{repair_id}", response_model=RepairResponse, summary="报修单详情")
def get_repair(
    repair_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repair = (
        db.query(PublicRepair)
        .options(joinedload(PublicRepair.dispatch), joinedload(PublicRepair.status_logs))
        .filter(PublicRepair.id == repair_id)
        .first()
    )
    if not repair:
        raise HTTPException(status_code=404, detail="报修单不存在")
    return _repair_to_response(repair, db=db, include_relations=True)


@router.post("/{repair_id}/accept", response_model=RepairResponse, summary="受理报修单(自动创建派单)")
def accept_repair(
    repair_id: int,
    data: RepairAcceptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.SERVICE_DESK.value)),
):
    repair = (
        db.query(PublicRepair)
        .options(joinedload(PublicRepair.dispatch), joinedload(PublicRepair.status_logs))
        .filter(PublicRepair.id == repair_id)
        .first()
    )
    if not repair:
        raise HTTPException(status_code=404, detail="报修单不存在")
    if repair.status != RepairStatus.PENDING.value:
        raise HTTPException(status_code=400, detail=f"当前状态 {repair.status} 不可受理，需为 pending")

    repair.status = RepairStatus.ACCEPTED.value
    repair.handler_id = current_user.id
    repair.accepted_at = datetime.now()

    log = StatusLog(
        repair_id=repair.id,
        from_status=RepairStatus.PENDING.value,
        to_status=RepairStatus.ACCEPTED.value,
        operator_id=current_user.id,
        operator_name=current_user.display_name,
        operator_role=current_user.role,
        remark=data.remark or "受理报修单",
    )
    db.add(log)

    dispatch = EngineeringDispatch(
        dispatch_no=_generate_dispatch_no(db),
        repair_id=repair.id,
        work_content=data.work_content,
        work_type=data.work_type,
        estimated_hours=data.estimated_hours,
        status=DispatchStatus.PENDING.value,
        sla_deadline=datetime.now() + timedelta(hours=SLA_HOURS_DISPATCH),
        dispatcher_id=current_user.id,
        engineer_id=data.engineer_id,
    )
    db.add(dispatch)
    db.flush()

    repair.status = RepairStatus.DISPATCHED.value
    repair.dispatched_at = datetime.now()

    dispatch_log = StatusLog(
        repair_id=repair.id,
        from_status=RepairStatus.ACCEPTED.value,
        to_status=RepairStatus.DISPATCHED.value,
        operator_id=current_user.id,
        operator_name=current_user.display_name,
        operator_role=current_user.role,
        remark="受理后自动派单",
    )
    db.add(dispatch_log)

    dispatch_status_log = StatusLog(
        dispatch_id=dispatch.id,
        from_status=None,
        to_status=DispatchStatus.PENDING.value,
        operator_id=current_user.id,
        operator_name=current_user.display_name,
        operator_role=current_user.role,
        remark="创建工程派单",
    )
    db.add(dispatch_status_log)

    db.commit()
    db.refresh(repair)
    return _repair_to_response(repair, db=db, include_relations=True)


@router.post("/{repair_id}/close", response_model=RepairResponse, summary="关闭报修单")
def close_repair(
    repair_id: int,
    data: RepairCloseRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.OPERATION.value, RoleType.SERVICE_DESK.value)),
):
    if data is None:
        data = RepairCloseRequest()
    repair = (
        db.query(PublicRepair)
        .options(joinedload(PublicRepair.dispatch), joinedload(PublicRepair.status_logs))
        .filter(PublicRepair.id == repair_id)
        .first()
    )
    if not repair:
        raise HTTPException(status_code=404, detail="报修单不存在")
    if repair.status != RepairStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail=f"当前状态 {repair.status} 不可关闭，需为 completed")

    repair.status = RepairStatus.CLOSED.value
    repair.closed_at = datetime.now()

    log = StatusLog(
        repair_id=repair.id,
        from_status=RepairStatus.COMPLETED.value,
        to_status=RepairStatus.CLOSED.value,
        operator_id=current_user.id,
        operator_name=current_user.display_name,
        operator_role=current_user.role,
        remark=data.remark or "关闭报修单",
    )
    db.add(log)
    db.commit()
    db.refresh(repair)
    return _repair_to_response(repair, db=db, include_relations=True)


@router.put("/{repair_id}/complaint-ref", response_model=RepairResponse, summary="更新投诉关联编号")
def update_complaint_ref(
    repair_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.SERVICE_DESK.value)),
):
    repair = (
        db.query(PublicRepair)
        .options(joinedload(PublicRepair.dispatch), joinedload(PublicRepair.status_logs))
        .filter(PublicRepair.id == repair_id)
        .first()
    )
    if not repair:
        raise HTTPException(status_code=404, detail="报修单不存在")

    old_ref = repair.complaint_ref
    repair.complaint_ref = data.get("complaint_ref", "")

    log = StatusLog(
        repair_id=repair.id,
        from_status=repair.status,
        to_status=repair.status,
        operator_id=current_user.id,
        operator_name=current_user.display_name,
        operator_role=current_user.role,
        remark=f"更新投诉关联编号：{old_ref or '无'} → {repair.complaint_ref}",
    )
    db.add(log)
    db.commit()
    db.refresh(repair)
    return _repair_to_response(repair, db=db, include_relations=True)
