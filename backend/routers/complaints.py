from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Complaint, ProcessingLog, Reservation
from ..schemas import ComplaintCreate, ComplaintOut, ComplaintReply

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


@router.get("/", response_model=list[ComplaintOut])
def list_complaints(status: str = None, db: Session = Depends(get_db)):
    q = db.query(Complaint)
    if status:
        q = q.filter(Complaint.status == status)
    return q.order_by(Complaint.created_at.desc()).all()


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="投诉不存在")
    return c


@router.get("/{complaint_id}/related-reservation")
def get_related_reservation(complaint_id: int, db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="投诉不存在")
    if c.related_reservation_id:
        r = db.query(Reservation).filter(Reservation.id == c.related_reservation_id).first()
        if r:
            return {"id": r.id, "visitor_name": r.visitor_name, "reserved_date": r.reserved_date,
                    "fruit_type": r.fruit_type, "reserved_qty": r.reserved_qty, "actual_qty": r.actual_qty,
                    "status": r.status, "overbook_flag": r.overbook_flag}
    visitors = db.query(Reservation).filter(Reservation.visitor_name == c.visitor_name).all()
    if visitors:
        r = visitors[0]
        return {"id": r.id, "visitor_name": r.visitor_name, "reserved_date": r.reserved_date,
                "fruit_type": r.fruit_type, "reserved_qty": r.reserved_qty, "actual_qty": r.actual_qty,
                "status": r.status, "overbook_flag": r.overbook_flag}
    return None


@router.get("/timeout-warnings/list")
def get_timeout_warnings(hours: int = 2, db: Session = Depends(get_db)):
    threshold = datetime.now() - timedelta(hours=hours)
    pending = db.query(Complaint).filter(
        Complaint.status.in_(["pending", "processing"]),
        Complaint.created_at < threshold,
    ).all()
    result = []
    for c in pending:
        elapsed = datetime.now() - c.created_at.replace(tzinfo=None)
        result.append({
            "id": c.id, "visitor_name": c.visitor_name,
            "category": c.category, "status": c.status,
            "content": c.content[:80], "elapsed_hours": round(elapsed.total_seconds() / 3600, 1),
            "handler_name": c.handler_name,
        })
    return result


@router.post("/", response_model=ComplaintOut)
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    c = Complaint(
        visitor_name=data.visitor_name,
        visitor_phone=data.visitor_phone,
        content=data.content,
        category=data.category,
        related_reservation_id=data.related_reservation_id,
        status="pending",
    )
    db.add(c)
    db.commit()
    db.refresh(c)

    log = ProcessingLog(
        entity_type="complaint",
        entity_id=c.id,
        action="提交投诉",
        operator_name="system",
        operator_role="customer_service",
        notes=f"{data.visitor_name}: {data.content[:50]}",
        complaint_id=c.id,
    )
    db.add(log)
    db.commit()
    return c


@router.put("/{complaint_id}/handle", response_model=ComplaintOut)
def handle_complaint(complaint_id: int, handler_name: str, db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="投诉不存在")
    old_status = c.status
    c.status = "processing"
    c.handler_name = handler_name
    c.updated_at = datetime.now()
    db.commit()
    db.refresh(c)

    log = ProcessingLog(
        entity_type="complaint",
        entity_id=c.id,
        action=f"受理投诉: {old_status} → processing",
        operator_name=handler_name,
        operator_role="customer_service",
        notes=f"投诉#{c.id}已受理，由{handler_name}处理",
        complaint_id=c.id,
    )
    db.add(log)
    db.commit()
    return c


@router.put("/{complaint_id}/reply", response_model=ComplaintOut)
def reply_complaint(complaint_id: int, data: ComplaintReply, db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="投诉不存在")
    old_status = c.status
    c.status = "replied"
    c.handler_name = data.handler_name
    c.reply_content = data.reply_content
    c.updated_at = datetime.now()
    db.commit()
    db.refresh(c)

    log = ProcessingLog(
        entity_type="complaint",
        entity_id=c.id,
        action=f"回复投诉: {old_status} → replied",
        operator_name=data.handler_name,
        operator_role="customer_service",
        notes=f"回复: {data.reply_content[:80]}",
        complaint_id=c.id,
    )
    db.add(log)
    db.commit()
    return c
