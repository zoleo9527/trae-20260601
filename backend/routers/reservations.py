from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import Reservation, Complaint, ProcessingLog, FruitBatch, InventoryItem, InventoryChangeLog
from ..schemas import ReservationCreate, ReservationOut, ComplaintCreate, ComplaintOut, ComplaintReply

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


@router.get("/", response_model=list[ReservationOut])
def list_reservations(status: str = None, db: Session = Depends(get_db)):
    q = db.query(Reservation)
    if status:
        q = q.filter(Reservation.status == status)
    return q.order_by(Reservation.created_at.desc()).all()


@router.get("/{reservation_id}", response_model=ReservationOut)
def get_reservation(reservation_id: int, db: Session = Depends(get_db)):
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="预约不存在")
    return r


@router.get("/{reservation_id}/complete-check")
def check_complete_feasibility(reservation_id: int, db: Session = Depends(get_db)):
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="预约不存在")
    inv_items = db.query(InventoryItem).filter(InventoryItem.fruit_type == r.fruit_type).all()
    available_abc = sum(i.quantity for i in inv_items if i.grade in ("A", "B", "C"))
    grade_breakdown = {i.grade: i.quantity for i in inv_items}
    max_completable = available_abc
    return {
        "reservation_id": r.id,
        "fruit_type": r.fruit_type,
        "reserved_qty": r.reserved_qty,
        "available_abc": available_abc,
        "grade_breakdown": grade_breakdown,
        "max_completable_qty": max_completable,
        "can_complete_full": available_abc >= r.reserved_qty,
    }


@router.get("/available-inventory/{fruit_type}")
def get_available_inventory(fruit_type: str, db: Session = Depends(get_db)):
    inv_items = db.query(InventoryItem).filter(InventoryItem.fruit_type == fruit_type).all()
    total = sum(i.quantity for i in inv_items)
    grade_breakdown = {i.grade: i.quantity for i in inv_items}
    return {"fruit_type": fruit_type, "total_available": total, "grade_breakdown": grade_breakdown}


@router.post("/", response_model=ReservationOut)
def create_reservation(data: ReservationCreate, db: Session = Depends(get_db)):
    same_date = db.query(Reservation).filter(
        Reservation.reserved_date == data.reserved_date,
        Reservation.fruit_type == data.fruit_type,
        Reservation.status.in_(["pending", "confirmed"]),
    ).all()
    total_reserved = sum(r.reserved_qty for r in same_date) + data.reserved_qty

    inv_items = db.query(InventoryItem).filter(InventoryItem.fruit_type == data.fruit_type).all()
    available = sum(i.quantity for i in inv_items if i.grade in ("A", "B"))

    overbook = 1 if (available > 0 and total_reserved > available) or (available == 0 and data.reserved_qty > 0) else 0

    auto_note = f"[{datetime.now().strftime('%m-%d %H:%M')}] 系统: 预约{data.reserved_qty}斤"
    if available > 0:
        auto_note += f"，当前AB级库存{available}斤"
        if overbook:
            auto_note += f" ⚠️ 当日预约总量{total_reserved}斤已超AB级库存上限"
    else:
        auto_note += " ⚠️ 当前无AB级库存"
        overbook = 1

    notes = data.notes or ""
    if notes:
        notes = auto_note + "\n" + notes
    else:
        notes = auto_note

    r = Reservation(
        visitor_name=data.visitor_name,
        visitor_phone=data.visitor_phone,
        reserved_date=data.reserved_date,
        fruit_type=data.fruit_type,
        reserved_qty=data.reserved_qty,
        notes=notes,
        status="pending",
        overbook_flag=overbook,
    )
    db.add(r)
    db.commit()
    db.refresh(r)

    log = ProcessingLog(
        entity_type="reservation",
        entity_id=r.id,
        action="创建预约" + (" [超量预警]" if overbook else ""),
        operator_name="system",
        operator_role="customer_service",
        notes=f"{data.visitor_name}预约{data.reserved_date}采摘{data.fruit_type}{data.reserved_qty}斤，AB级库存{available}斤" + (" [超量]" if overbook else ""),
    )
    db.add(log)
    db.commit()
    return r


@router.put("/{reservation_id}/confirm", response_model=ReservationOut)
def confirm_reservation(reservation_id: int, handler_name: str, actual_qty: float = None, notes: str = "", db: Session = Depends(get_db)):
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="预约不存在")
    old_status = r.status
    original_qty = r.reserved_qty
    r.status = "confirmed"
    r.handler_name = handler_name

    append_note = f"\n[{datetime.now().strftime('%m-%d %H:%M')}] {handler_name}: 确认预约"
    if actual_qty is not None and actual_qty != r.reserved_qty:
        r.reserved_qty = actual_qty
        append_note += f"，原预约{original_qty}斤调整为{actual_qty}斤"
    if r.overbook_flag:
        inv_items = db.query(InventoryItem).filter(InventoryItem.fruit_type == r.fruit_type).all()
        available = sum(i.quantity for i in inv_items if i.grade in ("A", "B"))
        append_note += f" [超量预约已确认，当前AB级库存{available}斤，需调配]"
    if notes:
        append_note += f" - {notes}"
    r.notes = (r.notes or "") + append_note
    r.updated_at = datetime.now()
    db.commit()
    db.refresh(r)

    log = ProcessingLog(
        entity_type="reservation",
        entity_id=r.id,
        action=f"确认预约: {old_status} → confirmed",
        operator_name=handler_name,
        operator_role="customer_service",
        notes=f"预约#{r.id}已确认" + (f"，调整量为{actual_qty}斤（原{original_qty}斤）" if actual_qty and actual_qty != original_qty else ""),
    )
    db.add(log)
    db.commit()
    return r


@router.put("/{reservation_id}/complete", response_model=ReservationOut)
def complete_reservation(reservation_id: int, handler_name: str, actual_qty: float, notes: str = "", db: Session = Depends(get_db)):
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="预约不存在")

    inv_items = db.query(InventoryItem).filter(InventoryItem.fruit_type == r.fruit_type).all()
    available_abc = sum(i.quantity for i in inv_items if i.grade in ("A", "B", "C"))

    if actual_qty > available_abc:
        raise HTTPException(
            status_code=400,
            detail=f"库存不足，无法完成预约。当前{r.fruit_type}ABC级可用库存{available_abc}斤，实际采摘量{actual_qty}斤超出{actual_qty - available_abc}斤。请调整实际采摘量或先调配库存。",
        )

    remaining = actual_qty
    deducted_details = []
    for inv in sorted(inv_items, key=lambda x: x.grade):
        if remaining <= 0:
            break
        if inv.grade == "D":
            continue
        deduct = min(remaining, inv.quantity)
        if deduct > 0:
            before = inv.quantity
            inv.quantity = before - deduct
            inv.updated_at = datetime.now()
            remaining -= deduct
            deducted_details.append(f"{inv.grade}级扣减{deduct:.1f}斤")
            db.add(InventoryChangeLog(
                inventory_item_id=inv.id,
                change_type="reservation_out",
                quantity_before=before,
                quantity_after=inv.quantity,
                change_amount=-deduct,
                reason=f"游客{r.visitor_name}预约#{r.id}采摘出库",
                operator_name=handler_name,
                operator_role="customer_service",
                related_batch_no=f"预约#{r.id}",
            ))

    append_note = f"\n[{datetime.now().strftime('%m-%d %H:%M')}] {handler_name}: 完成预约，实际采摘{actual_qty}斤"
    if actual_qty != r.reserved_qty:
        diff = actual_qty - r.reserved_qty
        append_note += f"（预约{r.reserved_qty}斤，差异{diff:+.1f}斤）"
    append_note += f" [库存扣减: {', '.join(deducted_details)}]"
    if notes:
        append_note += f" - {notes}"
    r.status = "completed"
    r.actual_qty = actual_qty
    r.handler_name = handler_name
    r.notes = (r.notes or "") + append_note
    r.updated_at = datetime.now()
    db.commit()
    db.refresh(r)

    log = ProcessingLog(
        entity_type="reservation",
        entity_id=r.id,
        action="完成预约",
        operator_name=handler_name,
        operator_role="customer_service",
        notes=f"实际采摘{actual_qty}斤，库存已自动扣减({'; '.join(deducted_details)})",
    )
    db.add(log)
    db.commit()
    return r
