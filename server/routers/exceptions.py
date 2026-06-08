from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ExceptionRecord, TimelineEvent
from schemas import ExceptionHandle, ExceptionRecordRead

router = APIRouter(prefix="/api/exceptions", tags=["exceptions"])


@router.put("/{exception_id}/handle", response_model=ExceptionRecordRead)
def handle_exception(exception_id: int, data: ExceptionHandle, db: Session = Depends(get_db)):
    exc = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Exception record not found")

    exc.status = "已处理"
    exc.handler = data.handler
    exc.handled_at = datetime.utcnow()

    timeline = TimelineEvent(
        entity_type=exc.entity_type,
        entity_id=exc.entity_id,
        event_type="异常处理",
        description=f"异常已处理，处理人：{data.handler}" + (f"，结果：{data.result}" if data.result else ""),
        operator=data.handler,
    )
    db.add(timeline)
    db.commit()
    db.refresh(exc)
    return exc
