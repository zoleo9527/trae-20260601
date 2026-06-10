from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import FruitBatch, GradingRecord, ProcessingLog, User
from ..schemas import FruitBatchCreate, FruitBatchOut, GradingRecordCreate, GradingRecordOut, GradingConfirm, BatchStatusUpdate

router = APIRouter(prefix="/api/batches", tags=["batches"])


@router.get("/", response_model=list[FruitBatchOut])
def list_batches(status: str = None, guide_name: str = None, db: Session = Depends(get_db)):
    q = db.query(FruitBatch)
    if status:
        q = q.filter(FruitBatch.status == status)
    if guide_name:
        q = q.filter(FruitBatch.guide_name == guide_name)
    return q.order_by(FruitBatch.created_at.desc()).all()


@router.get("/{batch_id}", response_model=FruitBatchOut)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(FruitBatch).filter(FruitBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch


@router.post("/", response_model=FruitBatchOut)
def create_batch(data: FruitBatchCreate, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y%m%d")
    count = db.query(FruitBatch).filter(FruitBatch.batch_no.like(f"PK-{today}%")).count()
    batch_no = f"PK-{today}-{count + 1:03d}"
    batch = FruitBatch(
        batch_no=batch_no,
        fruit_type=data.fruit_type,
        picking_date=data.picking_date,
        picking_area=data.picking_area,
        quantity_picked=data.quantity_picked,
        unit=data.unit,
        guide_name=data.guide_name,
        status="picked",
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    log = ProcessingLog(
        entity_type="fruit_batch",
        entity_id=batch.id,
        action="创建采摘批次",
        operator_name=data.guide_name,
        operator_role="picking_guide",
        notes=f"批次{batch_no}，{data.fruit_type}{data.quantity_picked}{data.unit}，采摘区{data.picking_area}",
        batch_id=batch.id,
    )
    db.add(log)
    db.commit()
    return batch


@router.put("/{batch_id}/status", response_model=FruitBatchOut)
def update_batch_status(batch_id: int, data: BatchStatusUpdate, db: Session = Depends(get_db)):
    batch = db.query(FruitBatch).filter(FruitBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    old_status = batch.status
    batch.status = data.status
    batch.updated_at = datetime.now()
    db.commit()
    db.refresh(batch)
    role_map = {"picked": "picking_guide", "grading": "warehouse", "graded": "warehouse", "warehousing": "warehouse", "stored": "warehouse"}
    log = ProcessingLog(
        entity_type="fruit_batch",
        entity_id=batch.id,
        action=f"状态变更: {old_status} → {data.status}",
        operator_name=data.operator_name,
        operator_role=role_map.get(data.status, "warehouse"),
        notes=data.notes or f"批次{batch.batch_no}状态从{old_status}变更为{data.status}",
        batch_id=batch.id,
    )
    db.add(log)
    db.commit()
    return batch
