from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import PickingLoss, FruitBatch, ProcessingLog
from ..schemas import PickingLossCreate, PickingLossOut

router = APIRouter(prefix="/api/picking-loss", tags=["picking-loss"])


@router.get("/", response_model=list[PickingLossOut])
def list_losses(batch_id: int = None, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    q = db.query(PickingLoss).options(joinedload(PickingLoss.batch))
    if batch_id:
        q = q.filter(PickingLoss.batch_id == batch_id)
    return q.order_by(PickingLoss.created_at.desc()).all()


@router.get("/{loss_id}", response_model=PickingLossOut)
def get_loss(loss_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    loss = db.query(PickingLoss).options(joinedload(PickingLoss.batch)).filter(PickingLoss.id == loss_id).first()
    if not loss:
        raise HTTPException(status_code=404, detail="损耗记录不存在")
    return loss


@router.post("/", response_model=PickingLossOut)
def create_loss(data: PickingLossCreate, reporter_name: str = "", db: Session = Depends(get_db)):
    batch = db.query(FruitBatch).filter(FruitBatch.id == data.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")

    loss_qty = data.expected_qty - data.actual_qty
    loss_rate = (loss_qty / data.expected_qty * 100) if data.expected_qty > 0 else 0

    loss = PickingLoss(
        batch_id=data.batch_id,
        expected_qty=data.expected_qty,
        actual_qty=data.actual_qty,
        loss_qty=loss_qty,
        loss_rate=loss_rate,
        loss_reason=data.loss_reason,
        reporter_name=reporter_name or batch.guide_name,
    )
    db.add(loss)
    db.commit()
    db.refresh(loss)

    log = ProcessingLog(
        entity_type="picking_loss",
        entity_id=loss.id,
        action="上报采摘损耗",
        operator_name=reporter_name or batch.guide_name,
        operator_role="picking_guide",
        notes=f"批次{batch.batch_no}，预期{data.expected_qty}实际{data.actual_qty}，损耗{loss_qty}({loss_rate:.1f}%)",
        batch_id=batch.id,
    )
    db.add(log)
    db.commit()
    db.refresh(loss)
    return loss
