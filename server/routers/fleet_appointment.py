from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import (
    FleetAppointment, Container, GateRelease,
    TimelineEvent, ExceptionRecord, Attachment,
)
from schemas import (
    FleetAppointmentCreate, FleetAppointmentRead, FleetAppointmentDetail,
    FleetAppointmentAction, FleetAppointmentException,
    BatchAction, BatchResult,
    TimelineEventRead, ExceptionRecordRead, AttachmentRead, AttachmentCreate,
)

router = APIRouter(prefix="/api/fleet-appointments", tags=["fleet-appointments"])


@router.get("/", response_model=list[FleetAppointmentRead])
def list_fleet_appointments(
    status: Optional[str] = None,
    appointment_date: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    truck_company: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(FleetAppointment).options(
        joinedload(FleetAppointment.container),
        joinedload(FleetAppointment.gate_release).joinedload(GateRelease.container),
    )
    if status:
        query = query.filter(FleetAppointment.status == status)
    if appointment_date:
        query = query.filter(FleetAppointment.appointment_date == appointment_date)
    if date_from:
        query = query.filter(FleetAppointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(FleetAppointment.appointment_date <= date_to)
    if truck_company:
        query = query.filter(FleetAppointment.truck_company.contains(truck_company))
    return query.order_by(FleetAppointment.id.desc()).all()


@router.put("/batch/confirm", response_model=BatchResult)
def batch_confirm(data: BatchAction, db: Session = Depends(get_db)):
    success = []
    failed = []
    for aid in data.ids:
        appointment = db.query(FleetAppointment).filter(FleetAppointment.id == aid).first()
        if not appointment:
            failed.append({"id": aid, "reason": "未找到记录"})
            continue
        if appointment.status != "待确认":
            failed.append({"id": aid, "reason": f"当前状态为{appointment.status}，无法确认"})
            continue
        appointment.status = "已确认"
        appointment.confirmed_at = datetime.utcnow()
        if data.operator:
            appointment.operator = data.operator
        if data.notes:
            appointment.notes = data.notes
        timeline = TimelineEvent(
            entity_type="fleet_appointment",
            entity_id=aid,
            event_type="确认",
            description="批量确认预约",
            operator=data.operator or appointment.operator,
        )
        db.add(timeline)
        success.append(aid)
    db.commit()
    return BatchResult(success=success, failed=failed)


@router.put("/batch/cancel", response_model=BatchResult)
def batch_cancel(data: BatchAction, db: Session = Depends(get_db)):
    success = []
    failed = []
    for aid in data.ids:
        appointment = db.query(FleetAppointment).filter(FleetAppointment.id == aid).first()
        if not appointment:
            failed.append({"id": aid, "reason": "未找到记录"})
            continue
        if appointment.status in ("已完成", "已取消"):
            failed.append({"id": aid, "reason": f"当前状态为{appointment.status}，无法取消"})
            continue
        appointment.status = "已取消"
        if data.operator:
            appointment.operator = data.operator
        if data.notes:
            appointment.notes = data.notes
        timeline = TimelineEvent(
            entity_type="fleet_appointment",
            entity_id=aid,
            event_type="取消",
            description=f"批量取消预约，原因：{data.notes or '未说明'}",
            operator=data.operator or appointment.operator,
        )
        db.add(timeline)
        success.append(aid)
    db.commit()
    return BatchResult(success=success, failed=failed)


@router.get("/{appointment_id}", response_model=FleetAppointmentDetail)
def get_fleet_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = (
        db.query(FleetAppointment)
        .options(
            joinedload(FleetAppointment.container),
            joinedload(FleetAppointment.gate_release).joinedload(GateRelease.container),
        )
        .filter(FleetAppointment.id == appointment_id)
        .first()
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Fleet appointment not found")

    timeline = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.entity_type == "fleet_appointment", TimelineEvent.entity_id == appointment_id)
        .order_by(TimelineEvent.created_at.desc())
        .all()
    )
    exceptions = (
        db.query(ExceptionRecord)
        .filter(ExceptionRecord.entity_type == "fleet_appointment", ExceptionRecord.entity_id == appointment_id)
        .order_by(ExceptionRecord.created_at.desc())
        .all()
    )
    attachments = (
        db.query(Attachment)
        .filter(Attachment.entity_type == "fleet_appointment", Attachment.entity_id == appointment_id)
        .order_by(Attachment.created_at.desc())
        .all()
    )

    result = FleetAppointmentDetail.model_validate(appointment)
    result.timeline_events = [TimelineEventRead.model_validate(e) for e in timeline]
    result.exception_records = [ExceptionRecordRead.model_validate(e) for e in exceptions]
    result.attachments = [AttachmentRead.model_validate(a) for a in attachments]
    return result


@router.post("/", response_model=FleetAppointmentRead, status_code=201)
def create_fleet_appointment(data: FleetAppointmentCreate, db: Session = Depends(get_db)):
    if data.gate_release_id:
        gate_release = db.query(GateRelease).filter(GateRelease.id == data.gate_release_id).first()
        if not gate_release:
            raise HTTPException(status_code=404, detail="Gate release not found")
        if gate_release.notes and not data.notes:
            data.notes = gate_release.notes

    if data.container_id:
        container = db.query(Container).filter(Container.id == data.container_id).first()
        if not container:
            raise HTTPException(status_code=404, detail="Container not found")

    appointment = FleetAppointment(**data.model_dump())
    db.add(appointment)
    db.flush()

    timeline = TimelineEvent(
        entity_type="fleet_appointment",
        entity_id=appointment.id,
        event_type="创建",
        description=f"创建车队预约，车队：{appointment.truck_company or '未指定'}",
        operator=appointment.operator,
    )
    db.add(timeline)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}/confirm", response_model=FleetAppointmentRead)
def confirm_appointment(appointment_id: int, data: FleetAppointmentAction, db: Session = Depends(get_db)):
    appointment = db.query(FleetAppointment).filter(FleetAppointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Fleet appointment not found")

    appointment.status = "已确认"
    appointment.confirmed_at = datetime.utcnow()
    if data.operator:
        appointment.operator = data.operator
    if data.notes:
        appointment.notes = data.notes

    timeline = TimelineEvent(
        entity_type="fleet_appointment",
        entity_id=appointment_id,
        event_type="确认",
        description="预约已确认",
        operator=data.operator or appointment.operator,
    )
    db.add(timeline)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}/arrive", response_model=FleetAppointmentRead)
def arrive_appointment(appointment_id: int, data: FleetAppointmentAction, db: Session = Depends(get_db)):
    appointment = db.query(FleetAppointment).filter(FleetAppointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Fleet appointment not found")

    appointment.status = "已到场"
    if data.operator:
        appointment.operator = data.operator
    if data.notes:
        appointment.notes = data.notes

    timeline = TimelineEvent(
        entity_type="fleet_appointment",
        entity_id=appointment_id,
        event_type="到场",
        description="车辆已到场",
        operator=data.operator or appointment.operator,
    )
    db.add(timeline)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}/complete", response_model=FleetAppointmentRead)
def complete_appointment(appointment_id: int, data: FleetAppointmentAction, db: Session = Depends(get_db)):
    appointment = db.query(FleetAppointment).filter(FleetAppointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Fleet appointment not found")

    appointment.status = "已完成"
    appointment.completed_at = datetime.utcnow()
    if data.operator:
        appointment.operator = data.operator
    if data.notes:
        appointment.notes = data.notes

    timeline = TimelineEvent(
        entity_type="fleet_appointment",
        entity_id=appointment_id,
        event_type="完成",
        description="预约已完成",
        operator=data.operator or appointment.operator,
    )
    db.add(timeline)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}/cancel", response_model=FleetAppointmentRead)
def cancel_appointment(appointment_id: int, data: FleetAppointmentAction, db: Session = Depends(get_db)):
    appointment = db.query(FleetAppointment).filter(FleetAppointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Fleet appointment not found")

    appointment.status = "已取消"
    if data.operator:
        appointment.operator = data.operator
    if data.notes:
        appointment.notes = data.notes

    timeline = TimelineEvent(
        entity_type="fleet_appointment",
        entity_id=appointment_id,
        event_type="取消",
        description=f"预约已取消，原因：{data.notes or '未说明'}",
        operator=data.operator or appointment.operator,
    )
    db.add(timeline)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}/exception", response_model=FleetAppointmentRead)
def exception_appointment(appointment_id: int, data: FleetAppointmentException, db: Session = Depends(get_db)):
    appointment = db.query(FleetAppointment).filter(FleetAppointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Fleet appointment not found")

    appointment.status = "异常"
    if data.operator:
        appointment.operator = data.operator

    timeline = TimelineEvent(
        entity_type="fleet_appointment",
        entity_id=appointment_id,
        event_type="异常",
        description=f"标记为异常：{data.exception_type} - {data.description or ''}",
        operator=data.operator or appointment.operator,
    )
    db.add(timeline)

    exception = ExceptionRecord(
        entity_type="fleet_appointment",
        entity_id=appointment_id,
        exception_type=data.exception_type,
        description=data.description,
        status="待处理",
    )
    db.add(exception)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.post("/{appointment_id}/attachments", response_model=AttachmentRead, status_code=201)
def upload_attachment(appointment_id: int, data: AttachmentCreate, db: Session = Depends(get_db)):
    appointment = db.query(FleetAppointment).filter(FleetAppointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Fleet appointment not found")

    attachment = Attachment(
        entity_type="fleet_appointment",
        entity_id=appointment_id,
        file_name=data.file_name,
        file_type=data.file_type,
        file_size=data.file_size,
        uploaded_by=data.uploaded_by,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.get("/{appointment_id}/timeline", response_model=list[TimelineEventRead])
def get_timeline(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(FleetAppointment).filter(FleetAppointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Fleet appointment not found")
    events = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.entity_type == "fleet_appointment", TimelineEvent.entity_id == appointment_id)
        .order_by(TimelineEvent.created_at.desc())
        .all()
    )
    return events


@router.get("/{appointment_id}/exceptions", response_model=list[ExceptionRecordRead])
def get_exceptions(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(FleetAppointment).filter(FleetAppointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Fleet appointment not found")
    records = (
        db.query(ExceptionRecord)
        .filter(ExceptionRecord.entity_type == "fleet_appointment", ExceptionRecord.entity_id == appointment_id)
        .order_by(ExceptionRecord.created_at.desc())
        .all()
    )
    return records
