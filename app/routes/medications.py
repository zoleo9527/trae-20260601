from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import MedicationRecord, Pen, PigBatch
from app.schemas.schemas import (
    MedicationRecordCreate,
    MedicationRecordDetail,
    MedicationRecordRead,
)
from app.services.business import (
    detect_duplicate_medication,
    generate_withdrawal_alerts_for_batch,
)

router = APIRouter(prefix="/api/medications", tags=["用药记录管理"])


@router.get(
    "/",
    response_model=list[MedicationRecordRead],
    summary="兽医-查看用药记录",
)
def list_medications(
    batch_id: int | None = Query(None, description="批次筛选"),
    pen_id: int | None = Query(None, description="栏位筛选"),
    is_isolation: bool | None = Query(None, description="隔离用药筛选"),
    db: Session = Depends(get_db),
):
    q = db.query(MedicationRecord)
    if batch_id:
        q = q.filter(MedicationRecord.batch_id == batch_id)
    if pen_id:
        q = q.filter(MedicationRecord.pen_id == pen_id)
    if is_isolation is not None:
        q = q.filter(MedicationRecord.is_isolation == is_isolation)
    return q.order_by(MedicationRecord.start_date.desc()).all()


@router.get(
    "/{record_id}",
    response_model=MedicationRecordDetail,
    summary="获取用药记录详情含批次和栏位",
)
def get_medication(record_id: int, db: Session = Depends(get_db)):
    rec = (
        db.query(MedicationRecord)
        .options(joinedload(MedicationRecord.batch), joinedload(MedicationRecord.pen))
        .filter(MedicationRecord.id == record_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="用药记录不存在")
    return rec


@router.post(
    "/",
    response_model=MedicationRecordRead,
    summary="兽医-记录用药（含原因、剂量、停药期）",
)
def create_medication(data: MedicationRecordCreate, db: Session = Depends(get_db)):
    batch = db.get(PigBatch, data.batch_id)
    if not batch:
        raise HTTPException(status_code=400, detail="批次不存在")
    pen = db.get(Pen, data.pen_id)
    if not pen:
        raise HTTPException(status_code=400, detail="栏位不存在")

    dup_alert = detect_duplicate_medication(
        batch_id=data.batch_id,
        drug_name=data.drug_name,
        start_date=data.start_date,
        end_date=data.end_date,
        db=db,
    )
    if dup_alert:
        db.add(dup_alert)

    rec = MedicationRecord(**data.model_dump())
    db.add(rec)
    db.flush()

    generate_withdrawal_alerts_for_batch(batch_id=data.batch_id, db=db)

    db.commit()
    db.refresh(rec)
    return rec
