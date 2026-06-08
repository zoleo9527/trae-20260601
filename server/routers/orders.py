from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from models import CargoOrder, StatusChangeLog, LocationAllocation, PickupAppointment
from schemas import (
    CargoOrderCreate, CargoOrderOut, CargoOrderUpdate,
    StatusTransition, StatusChangeLogOut,
)
from database import get_db

router = APIRouter(prefix="/api/orders", tags=["orders"])

VALID_TRANSITIONS = {
    "created": ["accepting"],
    "accepting": ["pending_security", "supplementing", "security_rejected"],
    "supplementing": ["accepting"],
    "pending_security": ["inspecting"],
    "inspecting": ["pending_allocation", "security_rejected"],
    "security_rejected": ["supplementing", "inspecting"],
    "pending_allocation": ["allocated"],
    "allocated": ["allocation_changed", "appointed", "pending_pickup"],
    "allocation_changed": ["appointed", "pending_pickup"],
    "appointed": ["picked_up"],
    "pending_pickup": ["appointed", "picked_up"],
    "picked_up": [],
}


@router.get("", response_model=List[CargoOrderOut])
def list_orders(
    status: Optional[str] = None,
    is_urgent: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    q = db.query(CargoOrder)
    if status:
        q = q.filter(CargoOrder.status == status)
    if is_urgent is not None:
        q = q.filter(CargoOrder.is_urgent == is_urgent)
    return q.order_by(CargoOrder.updated_at.desc()).all()


@router.get("/{order_id}", response_model=CargoOrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(CargoOrder).filter(CargoOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("", response_model=CargoOrderOut, status_code=201)
def create_order(data: CargoOrderCreate, db: Session = Depends(get_db)):
    import datetime
    now = datetime.datetime.now()
    order_no = f"CA-{now.strftime('%Y%m%d')}-{db.query(CargoOrder).count() + 1:03d}"
    order = CargoOrder(order_no=order_no, **data.model_dump())
    db.add(order)
    db.flush()

    log = StatusChangeLog(
        entity_type="cargo_order",
        entity_id=order.id,
        from_status=None,
        to_status="created",
        changed_by="系统",
        role="system",
        notes=f"航班{data.flight_no}到港，自动生成货单",
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return order


@router.post("/transition", response_model=CargoOrderOut)
def transition_status(data: StatusTransition, db: Session = Depends(get_db)):
    order = db.query(CargoOrder).filter(CargoOrder.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    from_status = order.status
    allowed = VALID_TRANSITIONS.get(from_status, [])
    if data.to_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"不允许从 {from_status} 转到 {data.to_status}，允许的目标状态: {allowed}",
        )

    order.status = data.to_status
    if data.to_status == "accepting":
        order.is_urgent = True

    log = StatusChangeLog(
        entity_type="cargo_order",
        entity_id=order.id,
        from_status=from_status,
        to_status=data.to_status,
        changed_by=data.changed_by,
        role=data.role,
        notes=data.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return order


@router.patch("/{order_id}", response_model=CargoOrderOut)
def update_order(order_id: int, data: CargoOrderUpdate, db: Session = Depends(get_db)):
    order = db.query(CargoOrder).filter(CargoOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if data.is_urgent is not None:
        order.is_urgent = data.is_urgent
    if data.status is not None:
        order.status = data.status
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/logs", response_model=List[StatusChangeLogOut])
def get_order_logs(order_id: int, db: Session = Depends(get_db)):
    return (
        db.query(StatusChangeLog)
        .filter(StatusChangeLog.entity_type == "cargo_order", StatusChangeLog.entity_id == order_id)
        .order_by(StatusChangeLog.created_at)
        .all()
    )
