from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import FruitBatch, GradingRecord, InventoryItem, InventoryChangeLog, ProcessingLog
from ..schemas import GradingRecordCreate, GradingRecordOut, GradingConfirm

router = APIRouter(prefix="/api/grading", tags=["grading"])


@router.get("/", response_model=list[GradingRecordOut])
def list_grading_records(status: str = None, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    q = db.query(GradingRecord).options(joinedload(GradingRecord.batch))
    if status:
        q = q.filter(GradingRecord.status == status)
    return q.order_by(GradingRecord.created_at.desc()).all()


@router.get("/{grading_id}", response_model=GradingRecordOut)
def get_grading_record(grading_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    record = db.query(GradingRecord).options(joinedload(GradingRecord.batch)).filter(GradingRecord.id == grading_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="分级记录不存在")
    return record


@router.post("/", response_model=GradingRecordOut)
def create_grading_record(data: GradingRecordCreate, db: Session = Depends(get_db)):
    batch = db.query(FruitBatch).filter(FruitBatch.id == data.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    if batch.status not in ("picked", "grading"):
        raise HTTPException(status_code=400, detail=f"批次状态为{batch.status}，无法进行分级")

    record = GradingRecord(
        batch_id=data.batch_id,
        grade_a_qty=data.grade_a_qty,
        grade_b_qty=data.grade_b_qty,
        grade_c_qty=data.grade_c_qty,
        grade_d_qty=data.grade_d_qty,
        grader_name="",
        grading_notes=data.grading_notes,
        status="pending",
    )
    db.add(record)

    batch.status = "grading"
    batch.updated_at = datetime.now()
    db.commit()
    db.refresh(record)

    log = ProcessingLog(
        entity_type="grading_record",
        entity_id=record.id,
        action="创建分级记录",
        operator_name="",
        operator_role="warehouse",
        notes=f"批次{batch.batch_no}开始分级，A:{data.grade_a_qty} B:{data.grade_b_qty} C:{data.grade_c_qty} D:{data.grade_d_qty}",
        batch_id=batch.id,
        grading_id=record.id,
    )
    db.add(log)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{grading_id}/confirm", response_model=GradingRecordOut)
def confirm_grading(grading_id: int, data: GradingConfirm, db: Session = Depends(get_db)):
    record = db.query(GradingRecord).filter(GradingRecord.id == grading_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="分级记录不存在")
    if record.status == "confirmed":
        raise HTTPException(status_code=400, detail="该分级记录已确认")

    old_status = record.status
    record.status = "confirmed"
    record.grader_name = data.operator_name
    if data.notes:
        existing = record.grading_notes or ""
        record.grading_notes = existing + f"\n[{datetime.now().strftime('%m-%d %H:%M')}] {data.operator_name}: {data.notes}"
    record.updated_at = datetime.now()

    batch = db.query(FruitBatch).filter(FruitBatch.id == record.batch_id).first()
    if batch:
        batch.status = "graded"
        batch.updated_at = datetime.now()

        grade_map = {"A": record.grade_a_qty, "B": record.grade_b_qty, "C": record.grade_c_qty, "D": record.grade_d_qty}
        for grade_name, qty in grade_map.items():
            if qty <= 0:
                continue
            inv = db.query(InventoryItem).filter(
                InventoryItem.fruit_type == batch.fruit_type,
                InventoryItem.grade == grade_name
            ).first()
            if not inv:
                inv = InventoryItem(
                    fruit_type=batch.fruit_type,
                    grade=grade_name,
                    quantity=0,
                    unit=batch.unit,
                    warehouse_location="A区冷库",
                )
                db.add(inv)
                db.flush()

            before_qty = inv.quantity
            inv.quantity = before_qty + qty
            inv.updated_at = datetime.now()

            change_log = InventoryChangeLog(
                inventory_item_id=inv.id,
                change_type="grading_in",
                quantity_before=before_qty,
                quantity_after=inv.quantity,
                change_amount=qty,
                reason=f"批次{batch.batch_no}分级入库",
                operator_name=data.operator_name,
                operator_role="warehouse",
                related_batch_no=batch.batch_no,
            )
            db.add(change_log)

    log = ProcessingLog(
        entity_type="grading_record",
        entity_id=record.id,
        action=f"确认分级: {old_status} → confirmed",
        operator_name=data.operator_name,
        operator_role="warehouse",
        notes=data.notes or f"批次{batch.batch_no if batch else ''}分级确认完成，自动更新库存",
        batch_id=record.batch_id,
        grading_id=record.id,
    )
    db.add(log)
    db.commit()
    db.refresh(record)
    return record


@router.get("/pending-batches", response_model=list[dict])
def get_pending_grading_batches(db: Session = Depends(get_db)):
    batches = db.query(FruitBatch).filter(FruitBatch.status.in_(["picked", "grading"])).all()
    result = []
    for b in batches:
        has_grading = db.query(GradingRecord).filter(GradingRecord.batch_id == b.id).first()
        result.append({
            "id": b.id,
            "batch_no": b.batch_no,
            "fruit_type": b.fruit_type,
            "picking_date": b.picking_date,
            "picking_area": b.picking_area,
            "quantity_picked": b.quantity_picked,
            "unit": b.unit,
            "guide_name": b.guide_name,
            "status": b.status,
            "has_grading": has_grading is not None,
            "grading_id": has_grading.id if has_grading else None,
        })
    return result
