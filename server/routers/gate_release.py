from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import GateRelease, Container, TimelineEvent, ExceptionRecord, Attachment, FleetAppointment
from schemas import (
    GateReleaseCreate, GateReleaseRead, GateReleaseDetail, GateReleaseAction,
    TimelineEventRead, ExceptionRecordRead, AttachmentRead, AttachmentCreate,
)

router = APIRouter(prefix="/api/gate-releases", tags=["gate-releases"])


@router.get("/", response_model=list[GateReleaseRead])
def list_gate_releases(
    status: Optional[str] = None,
    release_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    container_no: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(GateRelease).options(joinedload(GateRelease.container))
    if status:
        query = query.filter(GateRelease.status == status)
    if release_type:
        query = query.filter(GateRelease.release_type == release_type)
    if date_from:
        query = query.filter(GateRelease.created_at >= date_from)
    if date_to:
        query = query.filter(GateRelease.created_at <= date_to + " 23:59:59")
    if container_no:
        query = query.join(Container).filter(Container.container_no.contains(container_no))
    return query.order_by(GateRelease.id.desc()).all()


@router.get("/{release_id}", response_model=GateReleaseDetail)
def get_gate_release(release_id: int, db: Session = Depends(get_db)):
    release = (
        db.query(GateRelease)
        .options(joinedload(GateRelease.container))
        .filter(GateRelease.id == release_id)
        .first()
    )
    if not release:
        raise HTTPException(status_code=404, detail="Gate release not found")

    timeline = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.entity_type == "gate_release", TimelineEvent.entity_id == release_id)
        .order_by(TimelineEvent.created_at.desc())
        .all()
    )
    exceptions = (
        db.query(ExceptionRecord)
        .filter(ExceptionRecord.entity_type == "gate_release", ExceptionRecord.entity_id == release_id)
        .order_by(ExceptionRecord.created_at.desc())
        .all()
    )
    attachments = (
        db.query(Attachment)
        .filter(Attachment.entity_type == "gate_release", Attachment.entity_id == release_id)
        .order_by(Attachment.created_at.desc())
        .all()
    )

    result = GateReleaseDetail.model_validate(release)
    result.timeline_events = [TimelineEventRead.model_validate(e) for e in timeline]
    result.exception_records = [ExceptionRecordRead.model_validate(e) for e in exceptions]
    result.attachments = [AttachmentRead.model_validate(a) for a in attachments]
    return result


@router.post("/", response_model=GateReleaseRead, status_code=201)
def create_gate_release(data: GateReleaseCreate, db: Session = Depends(get_db)):
    container = db.query(Container).filter(Container.id == data.container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")

    release = GateRelease(**data.model_dump())
    db.add(release)
    db.flush()

    timeline = TimelineEvent(
        entity_type="gate_release",
        entity_id=release.id,
        event_type="创建",
        description=f"创建{release.release_type}放行记录，箱号：{container.container_no}",
        operator=release.operator,
    )
    db.add(timeline)
    db.commit()
    db.refresh(release)

    release.container = container
    return release


@router.put("/{release_id}/release", response_model=GateReleaseRead)
def approve_release(release_id: int, data: GateReleaseAction, db: Session = Depends(get_db)):
    release = db.query(GateRelease).options(joinedload(GateRelease.container)).filter(GateRelease.id == release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Gate release not found")

    release.status = "已放行"
    release.released_at = datetime.utcnow()
    if data.operator:
        release.operator = data.operator
    if data.notes:
        release.notes = data.notes

    appointments = (
        db.query(FleetAppointment)
        .filter(FleetAppointment.gate_release_id == release_id)
        .all()
    )
    for apt in appointments:
        if release.notes:
            apt.notes = (apt.notes or "") + " | 闸口放行备注：" + release.notes

    container_no = release.container.container_no if release.container else ""
    timeline = TimelineEvent(
        entity_type="gate_release",
        entity_id=release_id,
        event_type="放行",
        description=f"已放行{release.release_type}，箱号：{container_no}",
        operator=data.operator or release.operator,
    )
    db.add(timeline)
    db.commit()
    db.refresh(release)
    return release


@router.put("/{release_id}/reject", response_model=GateReleaseRead)
def reject_release(release_id: int, data: GateReleaseAction, db: Session = Depends(get_db)):
    release = db.query(GateRelease).filter(GateRelease.id == release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Gate release not found")

    release.status = "异常退回"
    if data.operator:
        release.operator = data.operator
    if data.notes:
        release.notes = data.notes

    timeline = TimelineEvent(
        entity_type="gate_release",
        entity_id=release_id,
        event_type="退回",
        description=f"异常退回，原因：{data.notes or '未说明'}",
        operator=data.operator or release.operator,
    )
    db.add(timeline)

    exception = ExceptionRecord(
        entity_type="gate_release",
        entity_id=release_id,
        exception_type="其他",
        description=data.notes or "异常退回",
        status="待处理",
    )
    db.add(exception)
    db.commit()
    db.refresh(release)
    return release


@router.post("/{release_id}/attachments", response_model=AttachmentRead, status_code=201)
def upload_attachment(release_id: int, data: AttachmentCreate, db: Session = Depends(get_db)):
    release = db.query(GateRelease).filter(GateRelease.id == release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Gate release not found")

    attachment = Attachment(
        entity_type="gate_release",
        entity_id=release_id,
        file_name=data.file_name,
        file_type=data.file_type,
        file_size=data.file_size,
        uploaded_by=data.uploaded_by,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.get("/{release_id}/timeline", response_model=list[TimelineEventRead])
def get_timeline(release_id: int, db: Session = Depends(get_db)):
    release = db.query(GateRelease).filter(GateRelease.id == release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Gate release not found")
    events = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.entity_type == "gate_release", TimelineEvent.entity_id == release_id)
        .order_by(TimelineEvent.created_at.desc())
        .all()
    )
    return events


@router.get("/{release_id}/exceptions", response_model=list[ExceptionRecordRead])
def get_exceptions(release_id: int, db: Session = Depends(get_db)):
    release = db.query(GateRelease).filter(GateRelease.id == release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Gate release not found")
    records = (
        db.query(ExceptionRecord)
        .filter(ExceptionRecord.entity_type == "gate_release", ExceptionRecord.entity_id == release_id)
        .order_by(ExceptionRecord.created_at.desc())
        .all()
    )
    return records
