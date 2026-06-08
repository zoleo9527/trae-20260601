from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from models import PickupAppointment, LocationAllocation, CargoOrder, StatusChangeLog
from schemas import (
    PickupAppointmentCreate, PickupAppointmentOut,
    PickupAppointmentUpdate, AppointmentAction,
    StatusChangeLogOut,
)
from database import get_db

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


@router.get("", response_model=List[PickupAppointmentOut])
def list_appointments(
    order_id: Optional[int] = None,
    status: Optional[str] = None,
    allocation_changed: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    q = db.query(PickupAppointment)
    if order_id:
        q = q.filter(PickupAppointment.order_id == order_id)
    if status:
        q = q.filter(PickupAppointment.status == status)
    if allocation_changed is not None:
        q = q.filter(PickupAppointment.allocation_changed == allocation_changed)
    return q.order_by(PickupAppointment.updated_at.desc()).all()


@router.get("/{appointment_id}", response_model=PickupAppointmentOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appt = db.query(PickupAppointment).filter(PickupAppointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.post("", response_model=PickupAppointmentOut, status_code=201)
def create_appointment(data: PickupAppointmentCreate, db: Session = Depends(get_db)):
    order = db.query(CargoOrder).filter(CargoOrder.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    allocation = (
        db.query(LocationAllocation)
        .filter(LocationAllocation.order_id == data.order_id, LocationAllocation.status == "active")
        .first()
    )

    appointment = PickupAppointment(
        order_id=data.order_id,
        appointee=data.appointee,
        contact_phone=data.contact_phone,
        appointment_time=data.appointment_time,
        notes=data.notes,
    )

    if allocation:
        appointment.allocation_id = allocation.id
        appointment.allocation_snapshot = allocation.full_location
        appointment.notes = (data.notes + f"\n[库位信息] {allocation.full_location}，备注：{allocation.notes}").strip()
    else:
        appointment.allocation_snapshot = "暂未分配库位"

    db.add(appointment)
    db.flush()

    from_status = order.status
    if order.status in ("allocated", "allocation_changed"):
        order.status = "appointed"
        from_status_for_log = from_status
    else:
        from_status_for_log = order.status

    log = StatusChangeLog(
        entity_type="cargo_order",
        entity_id=order.id,
        from_status=from_status_for_log,
        to_status=order.status,
        changed_by=data.appointee,
        role="cargo_acceptor",
        notes=f"创建提货预约，预约人：{data.appointee}。{data.notes}",
    )
    db.add(log)

    alog = StatusChangeLog(
        entity_type="pickup_appointment",
        entity_id=appointment.id,
        from_status=None,
        to_status="pending",
        changed_by=data.appointee,
        role="cargo_acceptor",
        notes=f"创建提货预约。{data.notes}",
    )
    db.add(alog)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.post("/action", response_model=PickupAppointmentOut)
def appointment_action(data: AppointmentAction, db: Session = Depends(get_db)):
    appt = db.query(PickupAppointment).filter(PickupAppointment.id == data.appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    order = db.query(CargoOrder).filter(CargoOrder.id == appt.order_id).first()
    from_status = appt.status

    if data.action == "confirm":
        appt.status = "confirmed"
        if data.appointment_time:
            appt.appointment_time = data.appointment_time
        log_notes = f"预约确认。{data.notes}"

    elif data.action == "escalate":
        appt.status = "escalated"
        order.is_urgent = True
        log_notes = f"催办！提货预约被标记为紧急。{data.notes}"

    elif data.action == "reject":
        appt.status = "rejected"
        log_notes = f"退回提货预约。{data.notes}"

    elif data.action == "supplement":
        appt.status = "supplementing"
        log_notes = f"补材料中。{data.notes}"

    elif data.action == "complete":
        appt.status = "completed"
        order.status = "picked_up"
        olog = StatusChangeLog(
            entity_type="cargo_order",
            entity_id=order.id,
            from_status=order.status,
            to_status="picked_up",
            changed_by=data.changed_by,
            role="cargo_acceptor",
            notes=f"提货完成，预约人：{appt.appointee}",
        )
        db.add(olog)
        log_notes = f"提货完成。{data.notes}"

    elif data.action == "acknowledge_change":
        appt.allocation_changed = False
        log_notes = f"已确认库位变更，新库位：{appt.allocation_snapshot}。{data.notes}"

    else:
        raise HTTPException(status_code=400, detail=f"不支持的操作: {data.action}")

    if data.notes:
        appt.notes = (appt.notes + f"\n[{data.action}] {data.notes}").strip()

    alog = StatusChangeLog(
        entity_type="pickup_appointment",
        entity_id=appt.id,
        from_status=from_status,
        to_status=appt.status,
        changed_by=data.changed_by,
        role="cargo_acceptor",
        notes=log_notes,
    )
    db.add(alog)

    db.commit()
    db.refresh(appt)
    return appt


@router.get("/{appointment_id}/logs", response_model=List[StatusChangeLogOut])
def get_appointment_logs(appointment_id: int, db: Session = Depends(get_db)):
    return (
        db.query(StatusChangeLog)
        .filter(StatusChangeLog.entity_type == "pickup_appointment", StatusChangeLog.entity_id == appointment_id)
        .order_by(StatusChangeLog.created_at)
        .all()
    )
