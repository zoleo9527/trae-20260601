from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import InventoryItem, InventoryChangeLog, FruitBatch, ProcessingLog
from ..schemas import InventoryItemOut, InventoryChangeLogOut

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/", response_model=list[InventoryItemOut])
def list_inventory(fruit_type: str = None, grade: str = None, db: Session = Depends(get_db)):
    q = db.query(InventoryItem)
    if fruit_type:
        q = q.filter(InventoryItem.fruit_type == fruit_type)
    if grade:
        q = q.filter(InventoryItem.grade == grade)
    return q.order_by(InventoryItem.fruit_type, InventoryItem.grade).all()


@router.get("/changelog", response_model=list[InventoryChangeLogOut])
def get_changelog(fruit_type: str = None, batch_no: str = None, limit: int = 50, db: Session = Depends(get_db)):
    q = db.query(InventoryChangeLog)
    if batch_no:
        q = q.filter(InventoryChangeLog.related_batch_no == batch_no)
    if fruit_type:
        inv_ids = [i.id for i in db.query(InventoryItem).filter(InventoryItem.fruit_type == fruit_type).all()]
        if inv_ids:
            q = q.filter(InventoryChangeLog.inventory_item_id.in_(inv_ids))
        else:
            return []
    return q.order_by(InventoryChangeLog.created_at.desc()).limit(limit).all()


@router.post("/{item_id}/adjust", response_model=InventoryItemOut)
def adjust_inventory(item_id: int, change_amount: float, reason: str, operator_name: str, operator_role: str, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="库存项不存在")
    before = item.quantity
    item.quantity = before + change_amount
    if item.quantity < 0:
        item.quantity = 0
    item.updated_at = datetime.now()
    db.commit()
    db.refresh(item)

    change_log = InventoryChangeLog(
        inventory_item_id=item.id,
        change_type="manual_adjust" if change_amount >= 0 else "manual_deduct",
        quantity_before=before,
        quantity_after=item.quantity,
        change_amount=change_amount,
        reason=reason,
        operator_name=operator_name,
        operator_role=operator_role,
    )
    db.add(change_log)

    log = ProcessingLog(
        entity_type="inventory_item",
        entity_id=item.id,
        action=f"库存调整: {before} → {item.quantity} ({'+' if change_amount >= 0 else ''}{change_amount})",
        operator_name=operator_name,
        operator_role=operator_role,
        notes=reason,
    )
    db.add(log)
    db.commit()
    return item


@router.post("/warehousing/{batch_id}", response_model=InventoryItemOut)
def confirm_warehousing(batch_id: int, operator_name: str, db: Session = Depends(get_db)):
    batch = db.query(FruitBatch).filter(FruitBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    if batch.status not in ("graded", "warehousing"):
        raise HTTPException(status_code=400, detail=f"批次当前状态为{batch.status}，无法操作入库")

    old_status = batch.status
    if old_status == "graded":
        batch.status = "warehousing"
        batch.updated_at = datetime.now()
        db.commit()

        db.add(ProcessingLog(
            entity_type="fruit_batch",
            entity_id=batch.id,
            action="开始入库: graded → warehousing",
            operator_name=operator_name,
            operator_role="warehouse",
            notes=f"批次{batch.batch_no}开始入库流程，状态由已分级变为入库中",
            batch_id=batch.id,
        ))
        db.commit()
    elif old_status == "warehousing":
        batch.status = "stored"
        batch.updated_at = datetime.now()
        db.commit()

        db.add(ProcessingLog(
            entity_type="fruit_batch",
            entity_id=batch.id,
            action="确认入库: warehousing → stored",
            operator_name=operator_name,
            operator_role="warehouse",
            notes=f"批次{batch.batch_no}已完成入库，库存已同步更新",
            batch_id=batch.id,
        ))
        db.commit()

    inv_items = db.query(InventoryItem).filter(InventoryItem.fruit_type == batch.fruit_type).all()
    if inv_items:
        return inv_items[0]
    return db.query(InventoryItem).first()
