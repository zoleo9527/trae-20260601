import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from datetime import datetime, timedelta
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_active_user, log_operation

router = APIRouter(prefix="/api/handover", tags=["交班管理"])


def _build_summary_dict(db: Session, hours: int = 24):
    cutoff = datetime.utcnow() - timedelta(hours=hours)

    vacant_properties = db.query(models.Property).filter(
        models.Property.status == "vacant"
    ).order_by(models.Property.vacancy_date.desc()).all()

    pending_viewings = db.query(models.Viewing).filter(
        models.Viewing.status == "scheduled"
    ).order_by(models.Viewing.viewing_date.asc()).all()

    pending_exceptions = db.query(models.ExceptionRecord).filter(
        models.ExceptionRecord.status.in_(["pending", "processing"])
    ).order_by(
        models.ExceptionRecord.severity.desc(),
        models.ExceptionRecord.created_at.desc()
    ).all()

    recent_property_changes = db.query(models.OperationLog).filter(
        and_(
            models.OperationLog.target_type == "property",
            models.OperationLog.operation_type.in_(["vacancy_update", "status_update", "update"]),
            models.OperationLog.created_at >= cutoff
        )
    ).order_by(models.OperationLog.created_at.desc()).all()

    recent_viewing_changes = db.query(models.OperationLog).filter(
        and_(
            models.OperationLog.target_type == "viewing",
            models.OperationLog.created_at >= cutoff
        )
    ).order_by(models.OperationLog.created_at.desc()).all()

    recent_exception_changes = db.query(models.OperationLog).filter(
        and_(
            models.OperationLog.target_type == "exception",
            models.OperationLog.created_at >= cutoff
        )
    ).order_by(models.OperationLog.created_at.desc()).all()

    recent_logs = (recent_property_changes + recent_viewing_changes + recent_exception_changes)
    recent_logs.sort(key=lambda x: x.created_at, reverse=True)
    recent_logs = recent_logs[:50]

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    tomorrow_end = today_end + timedelta(days=1)

    today_viewings = [v for v in pending_viewings if today_start <= v.viewing_date < today_end]
    tomorrow_viewings = [v for v in pending_viewings if today_end <= v.viewing_date < tomorrow_end]

    vacant_list = []
    for p in vacant_properties:
        viewing_count = len(p.viewings) if p.viewings else 0
        exception_count = len([e for e in (p.exceptions or []) if e.status in ["pending", "processing"]])
        vacant_list.append({
            "id": p.id,
            "property_no": p.property_no,
            "building": p.building,
            "floor": p.floor,
            "room_no": p.room_no,
            "area": p.area,
            "monthly_rent": p.monthly_rent,
            "vacancy_reason": p.vacancy_reason,
            "vacancy_date": p.vacancy_date.isoformat() if p.vacancy_date else None,
            "expected_available_date": p.expected_available_date.isoformat() if p.expected_available_date else None,
            "remarks": p.remarks,
            "handler_name": p.handler.real_name if p.handler else None,
            "viewing_count": viewing_count,
            "pending_exception_count": exception_count,
            "days_vacant": (datetime.utcnow() - p.vacancy_date).days if p.vacancy_date else None
        })

    viewing_list = []
    for v in pending_viewings:
        viewing_list.append({
            "id": v.id,
            "property_id": v.property_id,
            "customer_name": v.customer_name,
            "customer_phone": v.customer_phone,
            "viewing_date": v.viewing_date.isoformat() if v.viewing_date else None,
            "viewing_duration": v.viewing_duration,
            "remarks": v.remarks,
            "handler_name": v.handler.real_name if v.handler else None,
            "property_info": {
                "id": v.property.id,
                "property_no": v.property.property_no,
                "building": v.property.building,
                "floor": v.property.floor,
                "room_no": v.property.room_no,
                "area": v.property.area,
                "status": v.property.status,
                "remarks": v.property.remarks
            } if v.property else None
        })

    exception_list = []
    for e in pending_exceptions:
        exception_list.append({
            "id": e.id,
            "exception_type": e.exception_type,
            "title": e.title,
            "description": e.description,
            "severity": e.severity,
            "status": e.status,
            "solution": e.solution,
            "remarks": e.remarks,
            "handler_name": e.handler.real_name if e.handler else None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "property_info": {
                "id": e.property.id,
                "property_no": e.property.property_no,
                "building": e.property.building,
                "floor": e.property.floor,
                "room_no": e.property.room_no
            } if e.property else None,
            "viewing_info": {
                "id": e.viewing.id,
                "customer_name": e.viewing.customer_name,
                "viewing_date": e.viewing_date.isoformat() if e.viewing.viewing_date else None
            } if e.viewing else None
        })

    log_list = []
    for log in recent_logs:
        log_list.append({
            "id": log.id,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "operation_type": log.operation_type,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "remarks": log.remarks,
            "operator_id": log.operator_id,
            "operator_name": log.operator_name,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })

    return {
        "stats": {
            "vacant_count": len(vacant_properties),
            "pending_viewing_count": len(pending_viewings),
            "pending_exception_count": len(pending_exceptions),
            "today_viewing_count": len(today_viewings),
            "tomorrow_viewing_count": len(tomorrow_viewings),
            "recent_change_count": len(recent_logs)
        },
        "today_viewings": [v for v in viewing_list if v in _filter_by_date(viewing_list, today_start, today_end)],
        "tomorrow_viewings": [v for v in viewing_list if v in _filter_by_date(viewing_list, today_end, tomorrow_end)],
        "vacant_properties": vacant_list,
        "pending_viewings": viewing_list,
        "pending_exceptions": exception_list,
        "recent_changes": log_list
    }


def _filter_by_date(viewing_list, start, end):
    result = []
    for v in viewing_list:
        if v.get("viewing_date"):
            dt = datetime.fromisoformat(v["viewing_date"])
            if start <= dt < end:
                result.append(v)
    return result


@router.get("/summary", response_model=dict)
async def get_handover_summary(
    hours: int = Query(24, ge=1, le=168, description="统计最近N小时内的变更"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    summary = _build_summary_dict(db, hours)
    summary["generated_at"] = datetime.utcnow().isoformat()
    summary["generated_by"] = current_user.real_name
    return summary


@router.get("/records", response_model=dict)
async def get_handover_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.HandoverRecord)
    if status:
        query = query.filter(models.HandoverRecord.status == status)

    total = query.count()
    items = query.order_by(models.HandoverRecord.created_at.desc()) \
        .offset((page - 1) * page_size) \
        .limit(page_size) \
        .all()

    result = []
    for item in items:
        item_dict = schemas.HandoverRecordResponse.model_validate(item).model_dump()
        if item.outgoing_user:
            item_dict["outgoing_user_name"] = item.outgoing_user.real_name
        if item.incoming_user:
            item_dict["incoming_user_name"] = item.incoming_user.real_name
        result.append(item_dict)

    return {"total": total, "page": page, "page_size": page_size, "items": result}


@router.get("/records/{record_id}", response_model=schemas.HandoverRecordResponse)
async def get_handover_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    record = db.query(models.HandoverRecord).filter(models.HandoverRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="交班记录不存在")

    result = schemas.HandoverRecordResponse.model_validate(record).model_dump()
    if record.outgoing_user:
        result["outgoing_user_name"] = record.outgoing_user.real_name
    if record.incoming_user:
        result["incoming_user_name"] = record.incoming_user.real_name
    return result


@router.post("/records", response_model=schemas.HandoverRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_handover_record(
    record_data: schemas.HandoverRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    summary = _build_summary_dict(db, hours=24)

    record = models.HandoverRecord(
        shift_start=record_data.shift_start,
        shift_end=record_data.shift_end,
        summary_snapshot=json.dumps(summary, ensure_ascii=False, default=str),
        vacant_count=summary["stats"]["vacant_count"],
        pending_viewing_count=summary["stats"]["pending_viewing_count"],
        pending_exception_count=summary["stats"]["pending_exception_count"],
        today_viewing_count=summary["stats"]["today_viewing_count"],
        tomorrow_viewing_count=summary["stats"]["tomorrow_viewing_count"],
        outgoing_user_id=current_user.id,
        outgoing_confirmed=True,
        outgoing_confirmed_at=datetime.utcnow(),
        outgoing_remarks=record_data.outgoing_remarks,
        status="submitted"
    )
    db.add(record)
    db.flush()

    log_operation(
        db,
        target_type="handover",
        target_id=record.id,
        operation_type="create",
        new_value=f"创建交班记录: {record_data.shift_start} ~ {record_data.shift_end}",
        remarks=record_data.outgoing_remarks,
        operator=current_user
    )

    db.commit()
    db.refresh(record)

    result = schemas.HandoverRecordResponse.model_validate(record).model_dump()
    result["outgoing_user_name"] = current_user.real_name
    return result


@router.put("/records/{record_id}/confirm", response_model=schemas.HandoverRecordResponse)
async def confirm_handover_record(
    record_id: int,
    confirm_data: schemas.HandoverRecordConfirm,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    record = db.query(models.HandoverRecord).filter(models.HandoverRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="交班记录不存在")

    if record.status not in ["submitted"]:
        raise HTTPException(status_code=400, detail="当前状态不允许确认签收")

    if record.outgoing_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="交班人不能签收自己的交班记录")

    record.incoming_user_id = current_user.id
    record.incoming_confirmed = True
    record.incoming_confirmed_at = datetime.utcnow()
    record.incoming_remarks = confirm_data.remarks
    record.status = "confirmed"

    log_operation(
        db,
        target_type="handover",
        target_id=record_id,
        operation_type="confirm",
        new_value=f"签收交班记录: {record.shift_start} ~ {record.shift_end}",
        remarks=confirm_data.remarks,
        operator=current_user
    )

    db.commit()
    db.refresh(record)

    result = schemas.HandoverRecordResponse.model_validate(record).model_dump()
    if record.outgoing_user:
        result["outgoing_user_name"] = record.outgoing_user.real_name
    result["incoming_user_name"] = current_user.real_name
    return result


@router.get("/records/{record_id}/snapshot", response_model=dict)
async def get_handover_snapshot(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    record = db.query(models.HandoverRecord).filter(models.HandoverRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="交班记录不存在")

    snapshot = json.loads(record.summary_snapshot) if record.summary_snapshot else {}
    snapshot["record_info"] = {
        "id": record.id,
        "shift_start": record.shift_start.isoformat() if record.shift_start else None,
        "shift_end": record.shift_end.isoformat() if record.shift_end else None,
        "outgoing_user_name": record.outgoing_user.real_name if record.outgoing_user else None,
        "incoming_user_name": record.incoming_user.real_name if record.incoming_user else None,
        "outgoing_confirmed": record.outgoing_confirmed,
        "incoming_confirmed": record.incoming_confirmed,
        "outgoing_remarks": record.outgoing_remarks,
        "incoming_remarks": record.incoming_remarks,
        "status": record.status,
        "created_at": record.created_at.isoformat() if record.created_at else None
    }
    return snapshot
