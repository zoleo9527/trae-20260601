from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    Order, OrderStatus, QualityInspection, InspectionResult,
    AnomalyRecord, AnomalyType, AnomalySeverity, AnomalyStatus,
)
from app.schemas import QualityInspectionCreate, QualityInspectionRead
from app.auth import inspector_or_admin, get_current_user
from app.errors import ErrorCode, ERROR_MESSAGES

router = APIRouter(prefix="/inspections", tags=["花艺质检"])


@router.post("", response_model=QualityInspectionRead, status_code=201)
def create_inspection(body: QualityInspectionCreate, db: Session = Depends(get_db), current_user=Depends(inspector_or_admin)):
    order = db.query(Order).filter(Order.id == body.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": "订单不存在"})

    if order.status != OrderStatus.INSPECTING:
        raise HTTPException(
            status_code=409,
            detail={"code": ErrorCode.INSPECTION_NOT_ALLOWED, "message": ERROR_MESSAGES[ErrorCode.INSPECTION_NOT_ALLOWED]},
        )

    all_pass = body.card_text_correct and body.flower_freshness_ok and body.arrangement_matches_spec
    overall = InspectionResult.PASS if all_pass else InspectionResult.FAIL

    inspection = QualityInspection(
        order_id=body.order_id,
        inspector_id=current_user.id,
        card_text_correct=body.card_text_correct,
        flower_freshness_ok=body.flower_freshness_ok,
        arrangement_matches_spec=body.arrangement_matches_spec,
        overall_result=overall,
        notes=body.notes,
    )
    db.add(inspection)
    db.flush()

    if not body.card_text_correct and order.greeting_card_text:
        anomaly = AnomalyRecord(
            order_id=order.id,
            inspection_id=inspection.id,
            anomaly_type=AnomalyType.CARD_ERROR,
            description=f"订单{order.order_no}贺卡内容与订单不符",
            severity=AnomalySeverity.HIGH,
            status=AnomalyStatus.OPEN,
            created_by=current_user.id,
        )
        db.add(anomaly)

    if overall == InspectionResult.PASS:
        order.status = OrderStatus.PASSED
    else:
        order.status = OrderStatus.REWORK

    from datetime import datetime
    order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(inspection)
    return inspection


@router.get("", response_model=list[QualityInspectionRead])
def list_inspections(
    order_id: int = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(QualityInspection)
    if order_id:
        q = q.filter(QualityInspection.order_id == order_id)
    return q.order_by(QualityInspection.id.desc()).all()


@router.get("/{inspection_id}", response_model=QualityInspectionRead)
def get_inspection(inspection_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    insp = db.query(QualityInspection).filter(QualityInspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": "质检记录不存在"})
    return insp
