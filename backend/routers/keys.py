from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/keys", tags=["keys"])


@router.get("", response_model=List[schemas.Key])
def get_keys(
    building: str = None,
    room: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Key)
    if building:
        query = query.filter(models.Key.building == building)
    if room:
        query = query.filter(models.Key.room == room)
    if status:
        query = query.filter(models.Key.status == status)
    return query.all()


@router.get("/{key_id}", response_model=schemas.Key)
def get_key(key_id: int, db: Session = Depends(get_db)):
    key = db.query(models.Key).filter(models.Key.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    return key


@router.post("", response_model=schemas.Key)
def create_key(key: schemas.KeyCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Key).filter(models.Key.key_number == key.key_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Key number already exists")
    
    db_key = models.Key(**key.model_dump())
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    
    log = models.OperationLog(
        key_id=db_key.id,
        action="create_key",
        operator="system",
        operator_role="admin",
        detail=f"Created key {key.key_number}"
    )
    db.add(log)
    db.commit()
    
    return db_key


@router.put("/{key_id}", response_model=schemas.Key)
def update_key(key_id: int, key_update: schemas.KeyUpdate, db: Session = Depends(get_db)):
    db_key = db.query(models.Key).filter(models.Key.id == key_id).first()
    if not db_key:
        raise HTTPException(status_code=404, detail="Key not found")
    
    update_data = key_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_key, field, value)
    db_key.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_key)
    
    log = models.OperationLog(
        key_id=db_key.id,
        action="update_key",
        operator="system",
        operator_role="admin",
        detail=f"Updated key {db_key.key_number}"
    )
    db.add(log)
    db.commit()
    
    return db_key


@router.delete("/{key_id}")
def delete_key(key_id: int, db: Session = Depends(get_db)):
    db_key = db.query(models.Key).filter(models.Key.id == key_id).first()
    if not db_key:
        raise HTTPException(status_code=404, detail="Key not found")
    
    key_number = db_key.key_number
    db.delete(db_key)
    db.commit()
    
    log = models.OperationLog(
        key_id=key_id,
        action="delete_key",
        operator="system",
        operator_role="admin",
        detail=f"Deleted key {key_number}"
    )
    db.add(log)
    db.commit()
    
    return {"message": "Key deleted successfully"}
