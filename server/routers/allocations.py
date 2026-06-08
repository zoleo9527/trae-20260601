from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from models import LocationAllocation, CargoOrder, PickupAppointment, StatusChangeLog
from schemas import (
    LocationAllocationCreate, LocationAllocationOut,
    LocationAllocationUpdate, AllocationAction,
    StatusChangeLogOut, PickupAppointmentOut,
)
from database import get_db

router = APIRouter(prefix="/api/allocations", tags=["allocations"])


@router.get("", response_model=List[LocationAllocationOut])
def list_allocations(
    order_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(LocationAllocation)
    if order_id:
        q = q.filter(LocationAllocation.order_id == order_id)
    if status:
        q = q.filter(LocationAllocation.status == status)
    return q.order_by(LocationAllocation.updated_at.desc()).all()


@router.get("/{allocation_id}", response_model=LocationAllocationOut)
def get_allocation(allocation_id: int, db: Session = Depends(get_db)):
    allocation = db.query(LocationAllocation).filter(LocationAllocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    return allocation


@router.post("", response_model=LocationAllocationOut, status_code=201)
def create_allocation(data: LocationAllocationCreate, db: Session = Depends(get_db)):
    order = db.query(CargoOrder).filter(CargoOrder.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    full_location = f"{data.zone}-{data.shelf}-{data.position}"
    allocation = LocationAllocation(
        order_id=data.order_id,
        zone=data.zone,
        shelf=data.shelf,
        position=data.position,
        full_location=full_location,
        allocated_by=data.allocated_by,
        notes=data.notes,
    )
    db.add(allocation)
    db.flush()

    order.status = "allocated"

    log = StatusChangeLog(
        entity_type="cargo_order",
        entity_id=order.id,
        from_status="pending_allocation",
        to_status="allocated",
        changed_by=data.allocated_by,
        role="warehouse_dispatcher",
        notes=f"分配库位{full_location}。{data.notes}",
    )
    db.add(log)

    alog = StatusChangeLog(
        entity_type="location_allocation",
        entity_id=allocation.id,
        from_status=None,
        to_status="active",
        changed_by=data.allocated_by,
        role="warehouse_dispatcher",
        notes=f"创建库位分配{full_location}。{data.notes}",
    )
    db.add(alog)

    appointments = db.query(PickupAppointment).filter(
        PickupAppointment.order_id == data.order_id,
        PickupAppointment.status.in_(["pending", "confirmed"]),
    ).all()
    for appt in appointments:
        appt.allocation_id = allocation.id
        appt.allocation_snapshot = full_location

    db.commit()
    db.refresh(allocation)
    return allocation


@router.post("/action", response_model=LocationAllocationOut)
def allocation_action(data: AllocationAction, db: Session = Depends(get_db)):
    allocation = db.query(LocationAllocation).filter(LocationAllocation.id == data.allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")

    order = db.query(CargoOrder).filter(CargoOrder.id == allocation.order_id).first()
    old_full = allocation.full_location

    if data.action == "change_location":
        if not all([data.zone, data.shelf, data.position]):
            raise HTTPException(status_code=400, detail="变更库位需提供新库区/架/位")
        allocation.zone = data.zone
        allocation.shelf = data.shelf
        allocation.position = data.position
        allocation.full_location = f"{data.zone}-{data.shelf}-{data.position}"
        allocation.version += 1

        order.status = "allocation_changed"

        clog = StatusChangeLog(
            entity_type="cargo_order",
            entity_id=order.id,
            from_status="allocated",
            to_status="allocation_changed",
            changed_by=data.changed_by,
            role="warehouse_dispatcher",
            notes=f"库位从{old_full}调整到{allocation.full_location}。{data.notes}",
        )
        db.add(clog)

        alog = StatusChangeLog(
            entity_type="location_allocation",
            entity_id=allocation.id,
            from_status="active",
            to_status="reallocated",
            changed_by=data.changed_by,
            role="warehouse_dispatcher",
            notes=f"库位变更{old_full}→{allocation.full_location}。{data.notes}",
        )
        db.add(alog)

        appointments = db.query(PickupAppointment).filter(
            PickupAppointment.allocation_id == allocation.id,
            PickupAppointment.status.in_(["pending", "confirmed"]),
        ).all()
        for appt in appointments:
            appt.allocation_changed = True
            appt.allocation_snapshot = f"{old_full}→{allocation.full_location}"
            appt.notes = (appt.notes + f"\n[库位变更通知] 库位从{old_full}调整为{allocation.full_location}，请提货人注意新库位。{data.notes}").strip()

            aplog = StatusChangeLog(
                entity_type="pickup_appointment",
                entity_id=appt.id,
                from_status=appt.status,
                to_status=appt.status,
                changed_by=data.changed_by,
                role="warehouse_dispatcher",
                notes=f"关联库位变更{old_full}→{allocation.full_location}，已通知提货预约方",
            )
            db.add(aplog)

    elif data.action == "release":
        allocation.status = "released"
        rlog = StatusChangeLog(
            entity_type="location_allocation",
            entity_id=allocation.id,
            from_status="active",
            to_status="released",
            changed_by=data.changed_by,
            role="warehouse_dispatcher",
            notes=f"释放库位{allocation.full_location}。{data.notes}",
        )
        db.add(rlog)

    elif data.action == "update_notes":
        if data.notes:
            allocation.notes = data.notes
        nlog = StatusChangeLog(
            entity_type="location_allocation",
            entity_id=allocation.id,
            from_status=allocation.status,
            to_status=allocation.status,
            changed_by=data.changed_by,
            role="warehouse_dispatcher",
            notes=f"更新备注：{data.notes}",
        )
        db.add(nlog)

    else:
        raise HTTPException(status_code=400, detail=f"不支持的操作: {data.action}")

    db.commit()
    db.refresh(allocation)
    return allocation


@router.get("/{allocation_id}/logs", response_model=List[StatusChangeLogOut])
def get_allocation_logs(allocation_id: int, db: Session = Depends(get_db)):
    return (
        db.query(StatusChangeLog)
        .filter(StatusChangeLog.entity_type == "location_allocation", StatusChangeLog.entity_id == allocation_id)
        .order_by(StatusChangeLog.created_at)
        .all()
    )


@router.get("/{allocation_id}/appointments", response_model=List[PickupAppointmentOut])
def get_allocation_appointments(allocation_id: int, db: Session = Depends(get_db)):
    return db.query(PickupAppointment).filter(PickupAppointment.allocation_id == allocation_id).all()
