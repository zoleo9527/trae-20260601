from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..models import (
    PublicRepair, EngineeringDispatch, StatusLog, User,
    RepairStatus, DispatchStatus,
)
from ..schemas import (
    DispatchResponse, DispatchListResponse,
    DispatchAcceptRequest, DispatchCompleteRequest, DispatchVerifyRequest,
    RepairBriefForDispatch, StatusLogResponse, UserResponse,
)
from ..auth import get_current_user, require_role, RoleType
from ..database import get_db

router = APIRouter(prefix="/api/dispatches", tags=["工程派单"])


def _dispatch_to_response(dispatch: EngineeringDispatch, db: Session = None, include_relations: bool = False) -> DispatchResponse:
    engineer_name = None
    dispatcher_name = None
    if db and dispatch.engineer_id:
        eng = db.query(User).filter(User.id == dispatch.engineer_id).first()
        if eng:
            engineer_name = eng.display_name
    if db and dispatch.dispatcher_id:
        disp = db.query(User).filter(User.id == dispatch.dispatcher_id).first()
        if disp:
            dispatcher_name = disp.display_name

    repair_resp = None
    status_logs_resp = []
    if include_relations:
        if dispatch.repair:
            r = dispatch.repair
            repair_resp = RepairBriefForDispatch(
                id=r.id,
                repair_no=r.repair_no,
                title=r.title,
                description=r.description or "",
                location=r.location,
                urgency=r.urgency,
                source=r.source,
            )
        if dispatch.status_logs:
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
                for sl in dispatch.status_logs
            ]
    actual_hours = None
    if dispatch.started_at and dispatch.completed_at:
        actual_hours = round((dispatch.completed_at - dispatch.started_at).total_seconds() / 3600, 2)

    return DispatchResponse(
        id=dispatch.id,
        dispatch_no=dispatch.dispatch_no,
        repair_id=dispatch.repair_id,
        work_content=dispatch.work_content,
        work_type=dispatch.work_type,
        estimated_hours=dispatch.estimated_hours,
        actual_hours=actual_hours,
        status=dispatch.status,
        sla_deadline=dispatch.sla_deadline,
        dispatcher_id=dispatch.dispatcher_id,
        dispatcher_name=dispatcher_name,
        engineer_id=dispatch.engineer_id,
        engineer_name=engineer_name,
        created_at=dispatch.created_at,
        accepted_at=dispatch.accepted_at,
        started_at=dispatch.started_at,
        completed_at=dispatch.completed_at,
        verified_at=dispatch.verified_at,
        completion_note=dispatch.completion_note,
        material_usage=dispatch.material_usage,
        photos=dispatch.photos,
        repair=repair_resp,
        status_logs=status_logs_resp,
    )


@router.get("/engineers", response_model=list[UserResponse], summary="获取工程师列表")
def list_engineers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.SERVICE_DESK.value, RoleType.ENGINEERING.value, RoleType.ADMIN.value)),
):
    return db.query(User).filter(User.role == RoleType.ENGINEERING.value, User.is_active == True).order_by(User.id).all()


@router.get("/history", response_model=DispatchListResponse, summary="派单历史回看")
def dispatch_history(
    status: Optional[str] = None,
    engineer_id: Optional[int] = None,
    work_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    overtime: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.ENGINEERING.value, RoleType.OPERATION.value, RoleType.ADMIN.value, RoleType.SERVICE_DESK.value)),
):
    query = db.query(EngineeringDispatch).options(
        joinedload(EngineeringDispatch.repair), joinedload(EngineeringDispatch.status_logs)
    )
    if status:
        query = query.filter(EngineeringDispatch.status == status)
    if engineer_id:
        query = query.filter(EngineeringDispatch.engineer_id == engineer_id)
    if work_type:
        query = query.filter(EngineeringDispatch.work_type == work_type)
    if start_date:
        query = query.filter(EngineeringDispatch.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(EngineeringDispatch.created_at <= datetime.fromisoformat(end_date))

    all_items = query.all()

    if overtime is not None:
        filtered = []
        for d in all_items:
            if d.started_at and d.completed_at and d.estimated_hours is not None:
                actual = (d.completed_at - d.started_at).total_seconds() / 3600
                is_over = actual > d.estimated_hours
            else:
                is_over = False
            if overtime and is_over:
                filtered.append(d)
            elif not overtime and not is_over:
                filtered.append(d)
        all_items = filtered

    total = len(all_items)

    completed_statuses = [DispatchStatus.COMPLETED.value, DispatchStatus.VERIFIED.value]
    completed_dispatches = [
        d for d in all_items
        if d.status in completed_statuses and d.started_at and d.completed_at
    ]
    completed_count = len(completed_dispatches)
    if completed_count:
        total_hours = sum(
            (d.completed_at - d.started_at).total_seconds() / 3600
            for d in completed_dispatches
        )
        avg_actual_hours = round(total_hours / completed_count, 2)
    else:
        avg_actual_hours = None

    all_items.sort(key=lambda d: d.created_at, reverse=True)
    page_items = all_items[(page - 1) * page_size : page * page_size]
    return DispatchListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[_dispatch_to_response(d, db=db, include_relations=True) for d in page_items],
        completed_count=completed_count,
        avg_actual_hours=avg_actual_hours,
    )


@router.get("", response_model=DispatchListResponse, summary="派单列表")
def list_dispatches(
    status: Optional[str] = None,
    engineer_id: Optional[int] = None,
    work_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EngineeringDispatch).options(
        joinedload(EngineeringDispatch.repair), joinedload(EngineeringDispatch.status_logs)
    )
    if status:
        query = query.filter(EngineeringDispatch.status == status)
    if engineer_id:
        query = query.filter(EngineeringDispatch.engineer_id == engineer_id)
    if work_type:
        query = query.filter(EngineeringDispatch.work_type == work_type)
    if start_date:
        query = query.filter(EngineeringDispatch.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(EngineeringDispatch.created_at <= datetime.fromisoformat(end_date))

    total = query.count()
    items = (
        query.order_by(EngineeringDispatch.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return DispatchListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[_dispatch_to_response(d, db=db, include_relations=True) for d in items],
    )


@router.get("/{dispatch_id}", response_model=DispatchResponse, summary="派单详情")
def get_dispatch(
    dispatch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dispatch = (
        db.query(EngineeringDispatch)
        .options(joinedload(EngineeringDispatch.repair), joinedload(EngineeringDispatch.status_logs))
        .filter(EngineeringDispatch.id == dispatch_id)
        .first()
    )
    if not dispatch:
        raise HTTPException(status_code=404, detail="派单不存在")
    return _dispatch_to_response(dispatch, db=db, include_relations=True)


@router.post("/{dispatch_id}/accept", response_model=DispatchResponse, summary="接单")
def accept_dispatch(
    dispatch_id: int,
    data: DispatchAcceptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.ENGINEERING.value)),
):
    dispatch = (
        db.query(EngineeringDispatch)
        .options(joinedload(EngineeringDispatch.repair), joinedload(EngineeringDispatch.status_logs))
        .filter(EngineeringDispatch.id == dispatch_id)
        .first()
    )
    if not dispatch:
        raise HTTPException(status_code=404, detail="派单不存在")
    if dispatch.status != DispatchStatus.PENDING.value:
        raise HTTPException(status_code=400, detail=f"当前状态 {dispatch.status} 不可接单，需为 pending")

    dispatch.status = DispatchStatus.IN_PROGRESS.value
    dispatch.accepted_at = datetime.now()
    dispatch.started_at = datetime.now()
    dispatch.engineer_id = current_user.id

    dispatch_log = StatusLog(
        dispatch_id=dispatch.id,
        from_status=DispatchStatus.PENDING.value,
        to_status=DispatchStatus.IN_PROGRESS.value,
        operator_id=current_user.id,
        operator_name=current_user.display_name,
        operator_role=current_user.role,
        remark=data.remark or "接单并开始施工",
    )
    db.add(dispatch_log)

    repair = db.query(PublicRepair).filter(PublicRepair.id == dispatch.repair_id).first()
    if repair and repair.status == RepairStatus.DISPATCHED.value:
        repair.status = RepairStatus.IN_PROGRESS.value
        repair_log = StatusLog(
            repair_id=repair.id,
            from_status=RepairStatus.DISPATCHED.value,
            to_status=RepairStatus.IN_PROGRESS.value,
            operator_id=current_user.id,
            operator_name=current_user.display_name,
            operator_role=current_user.role,
            remark="工程师接单，报修单进入施工中",
        )
        db.add(repair_log)

    db.commit()
    db.refresh(dispatch)
    return _dispatch_to_response(dispatch, db=db, include_relations=True)


@router.post("/{dispatch_id}/complete", response_model=DispatchResponse, summary="完工")
def complete_dispatch(
    dispatch_id: int,
    data: DispatchCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.ENGINEERING.value)),
):
    dispatch = (
        db.query(EngineeringDispatch)
        .options(joinedload(EngineeringDispatch.repair), joinedload(EngineeringDispatch.status_logs))
        .filter(EngineeringDispatch.id == dispatch_id)
        .first()
    )
    if not dispatch:
        raise HTTPException(status_code=404, detail="派单不存在")
    if dispatch.status not in (DispatchStatus.ACCEPTED.value, DispatchStatus.IN_PROGRESS.value):
        raise HTTPException(status_code=400, detail=f"当前状态 {dispatch.status} 不可完工，需为 accepted 或 in_progress")

    old_status = dispatch.status
    dispatch.status = DispatchStatus.COMPLETED.value
    dispatch.completed_at = datetime.now()
    dispatch.completion_note = data.completion_note
    dispatch.material_usage = data.material_usage
    if data.photos:
        import json
        dispatch.photos = json.dumps(data.photos, ensure_ascii=False)

    dispatch_log = StatusLog(
        dispatch_id=dispatch.id,
        from_status=old_status,
        to_status=DispatchStatus.COMPLETED.value,
        operator_id=current_user.id,
        operator_name=current_user.display_name,
        operator_role=current_user.role,
        remark=data.remark or "完工",
    )
    db.add(dispatch_log)

    repair = db.query(PublicRepair).filter(PublicRepair.id == dispatch.repair_id).first()
    if repair and repair.status == RepairStatus.IN_PROGRESS.value:
        repair.status = RepairStatus.COMPLETED.value
        repair.completed_at = datetime.now()
        repair_log = StatusLog(
            repair_id=repair.id,
            from_status=RepairStatus.IN_PROGRESS.value,
            to_status=RepairStatus.COMPLETED.value,
            operator_id=current_user.id,
            operator_name=current_user.display_name,
            operator_role=current_user.role,
            remark="工程师完工，报修单完成",
        )
        db.add(repair_log)

    db.commit()
    db.refresh(dispatch)
    return _dispatch_to_response(dispatch, db=db, include_relations=True)


@router.post("/{dispatch_id}/verify", response_model=DispatchResponse, summary="验证完工")
def verify_dispatch(
    dispatch_id: int,
    data: DispatchVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.OPERATION.value, RoleType.SERVICE_DESK.value)),
):
    dispatch = (
        db.query(EngineeringDispatch)
        .options(joinedload(EngineeringDispatch.repair), joinedload(EngineeringDispatch.status_logs))
        .filter(EngineeringDispatch.id == dispatch_id)
        .first()
    )
    if not dispatch:
        raise HTTPException(status_code=404, detail="派单不存在")
    if dispatch.status != DispatchStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail=f"当前状态 {dispatch.status} 不可验证，需为 completed")

    dispatch.status = DispatchStatus.VERIFIED.value
    dispatch.verified_at = datetime.now()

    dispatch_log = StatusLog(
        dispatch_id=dispatch.id,
        from_status=DispatchStatus.COMPLETED.value,
        to_status=DispatchStatus.VERIFIED.value,
        operator_id=current_user.id,
        operator_name=current_user.display_name,
        operator_role=current_user.role,
        remark=data.remark or "验证完工",
    )
    db.add(dispatch_log)
    db.commit()
    db.refresh(dispatch)
    return _dispatch_to_response(dispatch, db=db, include_relations=True)
