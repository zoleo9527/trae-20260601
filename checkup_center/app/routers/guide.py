from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    CheckupRecord, CheckupItem, Patient, Notification, User
)
from app.schemas import (
    GuidePendingCheckupOut, NotificationCreate, NotificationOut
)

router = APIRouter(prefix="/api/guide", tags=["导检人员"])


@router.get("/pending-checkups", response_model=List[GuidePendingCheckupOut], summary="获取需要补检的人员列表")
def get_pending_checkups(db: Session = Depends(get_db)):
    records_with_missed = (
        db.query(CheckupRecord)
        .join(CheckupItem)
        .filter(CheckupItem.status == "missed")
        .distinct()
        .all()
    )

    results = []
    for record in records_with_missed:
        patient = db.get(Patient, record.patient_id)
        missed_items = (
            db.query(CheckupItem)
            .filter(CheckupItem.record_id == record.id, CheckupItem.status == "missed")
            .all()
        )
        notification = (
            db.query(Notification)
            .filter(Notification.record_id == record.id, Notification.type == "missed_item")
            .order_by(Notification.id.desc())
            .first()
        )
        results.append(GuidePendingCheckupOut(
            record_id=record.id,
            patient_name=patient.name,
            patient_phone=patient.phone,
            checkup_date=record.checkup_date,
            missed_items=[item.item_name for item in missed_items],
            notification_sent=notification is not None,
            notification_status=notification.status if notification else None
        ))
    return results


@router.post("/notify-missed", response_model=NotificationOut, summary="通知漏检人员补做")
def notify_missed(data: NotificationCreate, db: Session = Depends(get_db)):
    record = db.get(CheckupRecord, data.record_id)
    if not record:
        raise HTTPException(status_code=404, detail="体检记录不存在")

    patient = db.get(Patient, data.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="患者不存在")

    notification = Notification(
        record_id=data.record_id,
        patient_id=data.patient_id,
        type="missed_item",
        channel=data.channel,
        status="sent",
        content=data.content,
        sent_by=None,
        sent_at=datetime.now()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/arrange-recheck/{item_id}", response_model=dict, summary="安排补检（更新项目状态为进行中）")
def arrange_recheck(item_id: int, operator_id: int, db: Session = Depends(get_db)):
    item = db.get(CheckupItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="体检项目不存在")
    if item.status != "missed":
        raise HTTPException(status_code=400, detail=f"当前项目状态为'{item.status}'，无需补检安排")

    item.status = "in_progress"
    item.operator_id = operator_id
    db.commit()
    return {"message": f"已安排补检: {item.item_name}", "item_id": item.id, "new_status": item.status}


@router.get("/notification-status", response_model=List[NotificationOut], summary="查看通知发送状态")
def get_notification_status(
    record_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if record_id:
        query = query.filter(Notification.record_id == record_id)
    if status:
        query = query.filter(Notification.status == status)
    return query.order_by(Notification.id.desc()).all()


@router.put("/confirm-notification/{notification_id}", response_model=NotificationOut, summary="确认通知已送达")
def confirm_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="通知记录不存在")
    notification.status = "confirmed"
    notification.confirmed_at = datetime.now()
    db.commit()
    db.refresh(notification)
    return notification
