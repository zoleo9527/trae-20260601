from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    AnomalyRecord, AnomalyType, AnomalySeverity, AnomalyStatus, Order, UserRole,
)
from app.schemas import AnomalyRecordCreate, AnomalyRecordResolve, AnomalyRecordRead
from app.auth import get_current_user, inspector_or_admin, admin_only
from app.errors import ErrorCode, ERROR_MESSAGES

router = APIRouter(prefix="/anomalies", tags=["异常记录"])


@router.post("", response_model=AnomalyRecordRead, status_code=201)
def create_anomaly(body: AnomalyRecordCreate, db: Session = Depends(get_db), current_user=Depends(inspector_or_admin)):
    order = db.query(Order).filter(Order.id == body.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": "订单不存在"})

    anomaly = AnomalyRecord(
        order_id=body.order_id,
        inspection_id=body.inspection_id,
        anomaly_type=body.anomaly_type,
        description=body.description,
        severity=body.severity,
        status=AnomalyStatus.OPEN,
        created_by=current_user.id,
    )
    db.add(anomaly)
    db.commit()
    db.refresh(anomaly)
    return anomaly


@router.get("", response_model=list[AnomalyRecordRead])
def list_anomalies(
    order_id: Optional[int] = Query(None),
    anomaly_type: Optional[AnomalyType] = Query(None),
    status: Optional[AnomalyStatus] = Query(None),
    severity: Optional[AnomalySeverity] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(AnomalyRecord)
    if order_id:
        q = q.filter(AnomalyRecord.order_id == order_id)
    if anomaly_type:
        q = q.filter(AnomalyRecord.anomaly_type == anomaly_type)
    if status:
        q = q.filter(AnomalyRecord.status == status)
    if severity:
        q = q.filter(AnomalyRecord.severity == severity)
    return q.order_by(AnomalyRecord.id.desc()).all()


@router.get("/{anomaly_id}", response_model=AnomalyRecordRead)
def get_anomaly(anomaly_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    anomaly = db.query(AnomalyRecord).filter(AnomalyRecord.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": ERROR_MESSAGES[ErrorCode.NOT_FOUND]})
    return anomaly


@router.patch("/{anomaly_id}/acknowledge", response_model=AnomalyRecordRead)
def acknowledge_anomaly(anomaly_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    anomaly = db.query(AnomalyRecord).filter(AnomalyRecord.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": ERROR_MESSAGES[ErrorCode.NOT_FOUND]})
    if anomaly.status != AnomalyStatus.OPEN:
        raise HTTPException(status_code=409, detail={"code": ErrorCode.ANOMETY_ALREADY_RESOLVED, "message": "异常记录已处理，无法再次确认"})
    anomaly.status = AnomalyStatus.ACKNOWLEDGED
    db.commit()
    db.refresh(anomaly)
    return anomaly


@router.patch("/{anomaly_id}/resolve", response_model=AnomalyRecordRead)
def resolve_anomaly(anomaly_id: int, body: AnomalyRecordResolve, db: Session = Depends(get_db), current_user=Depends(admin_only)):
    anomaly = db.query(AnomalyRecord).filter(AnomalyRecord.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": ERROR_MESSAGES[ErrorCode.NOT_FOUND]})
    if anomaly.status == AnomalyStatus.RESOLVED:
        raise HTTPException(status_code=409, detail={"code": ErrorCode.ANOMETY_ALREADY_RESOLVED, "message": ERROR_MESSAGES[ErrorCode.ANOMETY_ALREADY_RESOLVED]})

    anomaly.status = AnomalyStatus.RESOLVED
    anomaly.resolved_by = current_user.id
    anomaly.resolved_at = datetime.utcnow()
    anomaly.resolution_note = body.resolution_note
    db.commit()
    db.refresh(anomaly)
    return anomaly
