from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import BatchStatus, Pen, PigBatch
from app.schemas.schemas import PigBatchCreate, PigBatchDetail, PigBatchRead

router = APIRouter(prefix="/api/batches", tags=["猪只批次管理"])


@router.get("/", response_model=list[PigBatchRead], summary="获取批次列表")
def list_batches(
    batch_status: BatchStatus | None = Query(None, description="批次状态筛选"),
    pen_id: int | None = Query(None, description="栏位筛选"),
    db: Session = Depends(get_db),
):
    q = db.query(PigBatch)
    if batch_status:
        q = q.filter(PigBatch.batch_status == batch_status)
    if pen_id:
        q = q.filter(PigBatch.pen_id == pen_id)
    return q.order_by(PigBatch.batch_code).all()


@router.get("/{batch_id}", response_model=PigBatchDetail, summary="获取批次详情含栏位信息")
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = (
        db.query(PigBatch)
        .options(joinedload(PigBatch.pen), joinedload(PigBatch.source_pen))
        .filter(PigBatch.id == batch_id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch


@router.post("/", response_model=PigBatchRead, summary="新增批次")
def create_batch(data: PigBatchCreate, db: Session = Depends(get_db)):
    existing = db.query(PigBatch).filter(PigBatch.batch_code == data.batch_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="批次编号已存在")
    pen = db.get(Pen, data.pen_id)
    if not pen:
        raise HTTPException(status_code=400, detail="目标栏位不存在")
    if data.source_pen_id is not None:
        source_pen = db.get(Pen, data.source_pen_id)
        if not source_pen:
            raise HTTPException(status_code=400, detail="来源栏位不存在")
    batch = PigBatch(**data.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch
