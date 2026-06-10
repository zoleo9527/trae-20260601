from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ProcessingLog
from ..schemas import ProcessingLogOut

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("/", response_model=list[ProcessingLogOut])
def list_logs(entity_type: str = None, entity_id: int = None, batch_id: int = None, limit: int = 100, db: Session = Depends(get_db)):
    q = db.query(ProcessingLog)
    if entity_type:
        q = q.filter(ProcessingLog.entity_type == entity_type)
    if entity_id:
        q = q.filter(ProcessingLog.entity_id == entity_id)
    if batch_id:
        q = q.filter(ProcessingLog.batch_id == batch_id)
    return q.order_by(ProcessingLog.created_at.desc()).limit(limit).all()


@router.get("/batch/{batch_id}", response_model=list[ProcessingLogOut])
def get_batch_logs(batch_id: int, db: Session = Depends(get_db)):
    return db.query(ProcessingLog).filter(ProcessingLog.batch_id == batch_id).order_by(ProcessingLog.created_at.asc()).all()
