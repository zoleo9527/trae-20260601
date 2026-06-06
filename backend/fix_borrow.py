
content = open('routers/borrow.py').read()

old_return = '''@router.post("/api/return", response_model=schemas.BorrowRecord)
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
    
    return record'''

new_return = '''@router.post("/api/return", response_model=schemas.BorrowRecord)
def return_key(request: schemas.ReturnRequest, db: Session = Depends(get_db)):
    record = None
    key = None
    
    if request.record_id:
        record = db.query(models.BorrowRecord).filter(
            models.BorrowRecord.id == request.record_id,
            models.BorrowRecord.actual_return_time.is_(None)
        ).first()
        if not record:
            raise HTTPException(status_code=404, detail="Borrow record not found")
        key = db.query(models.Key).filter(models.Key.id == record.key_id).first()
    elif request.key_id:
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
    else:
        raise HTTPException(status_code=400, detail="Either record_id or key_id must be provided")
    
    if not key:
        key = db.query(models.Key).filter(models.Key.id == record.key_id).first()
    
    now = datetime.utcnow()
    record.actual_return_time = now
    is_overdue = now > record.expected_return_time
    record.is_overdue = is_overdue
    
    if request.remark:
        record.remark = request.remark
    
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
    
    return record'''

content = content.replace(old_return, new_return)
open('routers/borrow.py', 'w').write(content)
print('Done')
