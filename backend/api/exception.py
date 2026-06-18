from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend.models.exception import ExceptionRecord, ExceptionType, ExceptionStatus
from backend.schemas.exception import ExceptionCreate, ExceptionUpdate, ExceptionResponse

router = APIRouter(prefix="/exceptions", tags=["exceptions"])

@router.post("/", response_model=ExceptionResponse)
def create_exception(exception: ExceptionCreate, db: Session = Depends(get_db)):
    new_exception = ExceptionRecord(
        type=exception.type,
        title=exception.title,
        description=exception.description,
        related_activity_id=exception.related_activity_id,
        related_application_id=exception.related_application_id,
        related_post_id=exception.related_post_id
    )
    db.add(new_exception)
    db.commit()
    db.refresh(new_exception)
    return new_exception

@router.get("/", response_model=list[ExceptionResponse])
def get_exceptions(
    type: ExceptionType | None = None,
    status: ExceptionStatus | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(ExceptionRecord)
    if type:
        query = query.filter(ExceptionRecord.type == type)
    if status:
        query = query.filter(ExceptionRecord.status == status)
    return query.all()

@router.get("/{exception_id}", response_model=ExceptionResponse)
def get_exception(exception_id: int, db: Session = Depends(get_db)):
    exception = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not exception:
        raise HTTPException(status_code=404, detail="Exception not found")
    return exception

@router.put("/{exception_id}", response_model=ExceptionResponse)
def update_exception(exception_id: int, exception: ExceptionUpdate, db: Session = Depends(get_db)):
    db_exception = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="Exception not found")
    
    if exception.status == ExceptionStatus.RESOLVED:
        db_exception.resolved_at = datetime.utcnow()
    
    for field, value in exception.dict(exclude_unset=True).items():
        setattr(db_exception, field, value)
    
    db.commit()
    db.refresh(db_exception)
    return db_exception