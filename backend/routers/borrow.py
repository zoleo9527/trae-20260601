from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
import models
import schemas

router = APIRouter(tags=["borrow"])


@router.get("/api/borrow-records", response_model=List[schemas.BorrowRecordWithKey])
def get_borrow_records(
    key_id: Optional[int] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = Query("all", pattern="^(active|returned|all)$"),
    limit: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.BorrowRecord).join(models.Key)
    
    if key_id:
        query = query.filter(models.BorrowRecord.key_id == key_id)
    if student_id:
        query = query.filter(models.BorrowRecord.student_id == student_id)
    
    if status == "active":
        query = query.filter(models.BorrowRecord.actual_return_time.is_(None))
    elif status == "returned":
        query = query.filter(models.BorrowRecord.actual_return_time.isnot(None))
    
    query = query.order_by(models.BorrowRecord.borrow_time.desc())
    
    if limit:
        query = query.limit(limit)
    
    return query.all()


@router.get("/api/borrow-records/{id}", response_model=schemas.BorrowRecordWithKey)
def get_borrow_record(id: int, db: Session = Depends(get_db)):
    record = db.query(models.BorrowRecord).join(models.Key).filter(models.BorrowRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Borrow record not found")
    return record


@router.get("/api/lost-records", response_model=List[schemas.LostRecordWithKey])
def get_lost_records(
    key_id: Optional[int] = None,
    status: Optional[str] = Query("all", pattern="^(lost|replaced|all)$"),
    limit: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.LostRecord).join(models.Key, models.LostRecord.key_id == models.Key.id)
    
    if key_id:
        query = query.filter(models.LostRecord.key_id == key_id)
    
    if status == "lost":
        query = query.filter(models.LostRecord.status == "lost")
    elif status == "replaced":
        query = query.filter(models.LostRecord.status == "replaced")
    
    query = query.order_by(models.LostRecord.lost_time.desc())
    
    if limit:
        query = query.limit(limit)
    
    return query.all()


@router.get("/api/lost-records/{id}", response_model=schemas.LostRecordWithKey)
def get_lost_record(id: int, db: Session = Depends(get_db)):
    record = db.query(models.LostRecord).join(models.Key, models.LostRecord.key_id == models.Key.id).filter(models.LostRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Lost record not found")
    return record


@router.post("/api/borrow", response_model=schemas.BorrowRecord)
def borrow_key(request: schemas.BorrowRequest, db: Session = Depends(get_db)):
    key = db.query(models.Key).filter(models.Key.id == request.key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    
    if key.status != "available":
        raise HTTPException(status_code=400, detail=f"Key is not available (current status: {key.status})")
    
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    key.status = "borrowed"
    key.current_holder = student.name
    key.updated_at = datetime.utcnow()
    
    borrow_record = models.BorrowRecord(
        key_id=key.id,
        student_id=student.id,
        student_name=student.name,
        borrower_role="student",
        expected_return_time=request.expected_return_time,
        operator=request.operator,
        remark=request.remark
    )
    db.add(borrow_record)
    
    log = models.OperationLog(
        key_id=key.id,
        action="borrow",
        operator=request.operator,
        operator_role="admin",
        detail=f"Key {key.key_number} borrowed by {student.name}"
    )
    db.add(log)
    
    db.commit()
    db.refresh(borrow_record)
    
    return borrow_record


@router.post("/api/return", response_model=schemas.BorrowRecord)
def return_key(request: schemas.ReturnRequest, db: Session = Depends(get_db)):
    key = db.query(models.Key).filter(models.Key.id == request.key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    
    if key.status != "borrowed":
        raise HTTPException(status_code=400, detail=f"Key is not borrowed (current status: {key.status})")
    
    record = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.key_id == key.id,
        models.BorrowRecord.actual_return_time.is_(None)
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Borrow record not found")
    
    now = datetime.utcnow()
    record.actual_return_time = now
    is_overdue = now > record.expected_return_time
    record.is_overdue = is_overdue
    
    key.status = "available"
    key.current_holder = None
    key.updated_at = now
    
    log = models.OperationLog(
        key_id=key.id,
        action="return",
        operator=request.operator,
        operator_role="admin",
        detail=f"Key {key.key_number} returned by {record.student_name}"
    )
    db.add(log)
    
    db.commit()
    db.refresh(record)
    
    return record


@router.post("/api/lost", response_model=schemas.LostRecord)
def report_lost(request: schemas.LostRequest, db: Session = Depends(get_db)):
    key = db.query(models.Key).filter(models.Key.id == request.key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    
    key.status = "lost"
    key.updated_at = datetime.utcnow()
    
    lost_record = models.LostRecord(
        key_id=key.id,
        student_name=request.student_name,
        lost_reason=request.lost_reason,
        replace_fee=request.replace_fee,
        operator=request.operator
    )
    db.add(lost_record)
    
    log = models.OperationLog(
        key_id=key.id,
        action="report_lost",
        operator=request.operator,
        operator_role="admin",
        detail=f"Key {key.key_number} reported lost by {request.student_name}"
    )
    db.add(log)
    
    db.commit()
    db.refresh(lost_record)
    
    return lost_record


@router.post("/api/replace", response_model=schemas.Key)
def replace_key(request: schemas.ReplaceRequest, db: Session = Depends(get_db)):
    lost_record = db.query(models.LostRecord).filter(models.LostRecord.id == request.lost_record_id).first()
    if not lost_record:
        raise HTTPException(status_code=404, detail="Lost record not found")
    
    if lost_record.status != "lost":
        raise HTTPException(status_code=400, detail="Lost record is not in lost status")
    
    existing_key = db.query(models.Key).filter(models.Key.key_number == request.new_key_number).first()
    if existing_key:
        raise HTTPException(status_code=400, detail="New key number already exists")
    
    now = datetime.utcnow()
    
    new_key = models.Key(
        key_number=request.new_key_number,
        building=request.building,
        room=request.room,
        key_type=request.key_type,
        status="available"
    )
    db.add(new_key)
    db.flush()
    
    lost_record.status = "replaced"
    lost_record.replace_time = now
    lost_record.new_key_id = new_key.id
    if request.replace_fee:
        lost_record.replace_fee = request.replace_fee
    
    log = models.OperationLog(
        key_id=lost_record.key_id,
        action="replace_key",
        operator=request.operator,
        operator_role="admin",
        detail=f"Key replaced: {lost_record.key_id} -> {new_key.id}"
    )
    db.add(log)
    
    db.commit()
    db.refresh(new_key)
    
    return new_key
