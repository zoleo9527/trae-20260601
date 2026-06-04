from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    CheckupRecord, CheckupItem, Patient, AbnormalIndicator,
    FollowUpRecommendation, Notification, User
)
from app.schemas import (
    PatientCreate, PatientOut,
    CheckupRecordCreate, CheckupRecordOut, CheckupRecordDetail,
    CheckupItemOut,
    AbnormalIndicatorCreate, AbnormalIndicatorOut,
    NotificationOut
)

router = APIRouter(prefix="/api", tags=["通用接口"])


@router.post("/patients", response_model=PatientOut, summary="创建患者")
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    existing = db.query(Patient).filter(Patient.id_number == data.id_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="该身份证号已存在")
    patient = Patient(**data.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/patients", response_model=List[PatientOut], summary="获取患者列表")
def get_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()


@router.get("/patients/{patient_id}", response_model=PatientOut, summary="获取患者详情")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="患者不存在")
    return patient


@router.post("/checkup-records", response_model=CheckupRecordOut, summary="创建体检记录")
def create_checkup_record(data: CheckupRecordCreate, db: Session = Depends(get_db)):
    patient = db.get(Patient, data.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="患者不存在")
    record = CheckupRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/checkup-records", response_model=List[CheckupRecordOut], summary="获取体检记录列表")
def get_checkup_records(
    patient_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CheckupRecord)
    if patient_id:
        query = query.filter(CheckupRecord.patient_id == patient_id)
    if status:
        query = query.filter(CheckupRecord.status == status)
    return query.order_by(CheckupRecord.id.desc()).all()


@router.get("/checkup-records/{record_id}", response_model=CheckupRecordDetail, summary="获取体检记录详情（含项目列表）")
def get_checkup_record_detail(record_id: int, db: Session = Depends(get_db)):
    record = db.get(CheckupRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="体检记录不存在")

    patient = db.get(Patient, record.patient_id)
    items = db.query(CheckupItem).filter(CheckupItem.record_id == record_id).all()

    return CheckupRecordDetail(
        id=record.id,
        patient_id=record.patient_id,
        checkup_date=record.checkup_date,
        status=record.status,
        items=[CheckupItemOut.model_validate(item) for item in items],
        patient_name=patient.name if patient else None
    )


@router.put("/checkup-records/{record_id}/status", response_model=CheckupRecordOut, summary="更新体检记录状态")
def update_checkup_record_status(record_id: int, status: str, db: Session = Depends(get_db)):
    record = db.get(CheckupRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="体检记录不存在")
    valid_statuses = ["pending", "in_progress", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"状态必须为: {', '.join(valid_statuses)}")
    record.status = status
    db.commit()
    db.refresh(record)
    return record


@router.post("/abnormal-indicators", response_model=AbnormalIndicatorOut, summary="录入异常指标")
def create_abnormal_indicator(data: AbnormalIndicatorCreate, db: Session = Depends(get_db)):
    item = db.get(CheckupItem, data.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="体检项目不存在")
    record = db.get(CheckupRecord, data.record_id)
    if not record:
        raise HTTPException(status_code=404, detail="体检记录不存在")

    indicator = AbnormalIndicator(
        item_id=data.item_id,
        record_id=data.record_id,
        indicator_name=data.indicator_name,
        indicator_value=data.indicator_value,
        reference_range=data.reference_range,
        severity=data.severity,
        discovered_at=datetime.now()
    )
    db.add(indicator)
    db.commit()
    db.refresh(indicator)
    return indicator


@router.get("/notifications", response_model=List[NotificationOut], summary="获取所有通知记录")
def get_notifications(
    patient_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if patient_id:
        query = query.filter(Notification.patient_id == patient_id)
    if type:
        query = query.filter(Notification.type == type)
    if status:
        query = query.filter(Notification.status == status)
    return query.order_by(Notification.id.desc()).all()


@router.get("/users", summary="获取用户列表")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "name": u.name, "role": u.role, "department": u.department} for u in users]
