from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from models import StatusChangeLog, CargoOrder
from schemas import StatusChangeLogOut, CargoOrderOut
from database import get_db

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("", response_model=List[StatusChangeLogOut])
def list_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    role: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(StatusChangeLog)
    if entity_type:
        q = q.filter(StatusChangeLog.entity_type == entity_type)
    if entity_id:
        q = q.filter(StatusChangeLog.entity_id == entity_id)
    if role:
        q = q.filter(StatusChangeLog.role == role)
    return q.order_by(StatusChangeLog.created_at.desc()).limit(limit).all()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_orders = db.query(CargoOrder).count()
    urgent_orders = db.query(CargoOrder).filter(CargoOrder.is_urgent == True).count()

    status_counts = {}
    for order in db.query(CargoOrder).all():
        s = order.status
        status_counts[s] = status_counts.get(s, 0) + 1

    allocation_changed_appointments = db.query(StatusChangeLog).filter(
        StatusChangeLog.to_status == "allocation_changed"
    ).count()

    recent_logs = db.query(StatusChangeLog).order_by(
        StatusChangeLog.created_at.desc()
    ).limit(10).all()

    return {
        "total_orders": total_orders,
        "urgent_orders": urgent_orders,
        "status_counts": status_counts,
        "allocation_changes": allocation_changed_appointments,
        "recent_logs": [
            {
                "id": l.id,
                "entity_type": l.entity_type,
                "entity_id": l.entity_id,
                "from_status": l.from_status,
                "to_status": l.to_status,
                "changed_by": l.changed_by,
                "role": l.role,
                "notes": l.notes,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in recent_logs
        ],
    }
