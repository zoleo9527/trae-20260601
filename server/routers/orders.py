from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from models import CargoOrder, StatusChangeLog, LocationAllocation, PickupAppointment
from schemas import (
    CargoOrderCreate, CargoOrderOut, CargoOrderUpdate,
    StatusTransition, StatusChangeLogOut,
    TimelineEntry, TimelineResponse,
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


ENTITY_TYPE_ACTION_LABELS = {
    ("cargo_order", "created"): "创建货单",
    ("cargo_order", "accepting"): "受理中",
    ("cargo_order", "pending_security"): "移交安检",
    ("cargo_order", "inspecting"): "安检中",
    ("cargo_order", "pending_allocation"): "待分配库位",
    ("cargo_order", "allocated"): "分配库位",
    ("cargo_order", "allocation_changed"): "库位变动",
    ("cargo_order", "appointed"): "已预约",
    ("cargo_order", "picked_up"): "提货完成",
    ("cargo_order", "supplementing"): "补材料中",
    ("cargo_order", "security_rejected"): "安检退回",
    ("location_allocation", "active"): "分配库位",
    ("location_allocation", "reallocated"): "库位变更",
    ("location_allocation", "released"): "释放库位",
    ("location_allocation", "notes_update"): "更新库位备注",
    ("pickup_appointment", "pending"): "创建提货预约",
    ("pickup_appointment", "confirmed"): "确认预约",
    ("pickup_appointment", "escalated"): "催办",
    ("pickup_appointment", "rejected"): "退回预约",
    ("pickup_appointment", "supplementing"): "补材料",
    ("pickup_appointment", "completed"): "提货完成",
}


def _resolve_action_label(entity_type: str, to_status: str, from_status: Optional[str]) -> str:
    key = (entity_type, to_status)
    if key in ENTITY_TYPE_ACTION_LABELS:
        return ENTITY_TYPE_ACTION_LABELS[key]
    if from_status is None:
        return "创建"
    to_label = STATUS_LABELS.get(to_status, to_status)
    return f"变更为「{to_label}」"


STATUS_LABELS = {
    "created": "新建",
    "accepting": "受理中",
    "supplementing": "补材料中",
    "pending_security": "待安检",
    "inspecting": "安检中",
    "security_rejected": "安检退回",
    "pending_allocation": "待分配库位",
    "allocated": "已分配库位",
    "allocation_changed": "库位变动",
    "appointed": "已预约",
    "pending_pickup": "待提货",
    "picked_up": "已提货",
    "active": "生效",
    "reallocated": "重新分配",
    "released": "已释放",
    "confirmed": "已确认",
    "escalated": "催办",
    "rejected": "已退回",
    "completed": "已完成",
    "pending": "待处理",
}


@router.get("/{order_id}/timeline", response_model=TimelineResponse)
def get_order_timeline(order_id: int, db: Session = Depends(get_db)):
    order = db.query(CargoOrder).filter(CargoOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    allocation = (
        db.query(LocationAllocation)
        .filter(LocationAllocation.order_id == order_id)
        .first()
    )

    appointments = (
        db.query(PickupAppointment)
        .filter(PickupAppointment.order_id == order_id)
        .all()
    )

    log_q = db.query(StatusChangeLog).filter(
        StatusChangeLog.entity_type == "cargo_order",
        StatusChangeLog.entity_id == order_id,
    )
    if allocation:
        alloc_logs = db.query(StatusChangeLog).filter(
            StatusChangeLog.entity_type == "location_allocation",
            StatusChangeLog.entity_id == allocation.id,
        )
        log_q = log_q.union(alloc_logs)

    for appt in appointments:
        appt_logs = db.query(StatusChangeLog).filter(
            StatusChangeLog.entity_type == "pickup_appointment",
            StatusChangeLog.entity_id == appt.id,
        )
        log_q = log_q.union(appt_logs)

    all_logs = log_q.order_by(StatusChangeLog.created_at.desc()).all()

    entries: list[TimelineEntry] = []
    for log in all_logs:
        action_label = _resolve_action_label(log.entity_type, log.to_status, log.from_status)
        entries.append(
            TimelineEntry(
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                action_label=action_label,
                from_status=log.from_status,
                to_status=log.to_status,
                changed_by=log.changed_by,
                role=log.role,
                notes=log.notes,
                created_at=log.created_at,
            )
        )

    return TimelineResponse(
        order=order,
        allocation=allocation,
        appointments=appointments,
        entries=entries,
    )
