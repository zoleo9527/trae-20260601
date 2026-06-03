from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/maintenance", tags=["维修记录"])

@router.post("/", response_model=schemas.MaintenanceRecord, summary="创建维修记录")
def create_maintenance(
    maintenance: schemas.MaintenanceRecordCreate,
    x_user_id: int = Header(..., description="操作用户ID"),
    db: Session = Depends(get_db)
):
    return crud.create_maintenance_record(db=db, maintenance=maintenance, user_id=x_user_id)

@router.get("/", response_model=List[schemas.MaintenanceRecord], summary="获取维修记录列表")
def read_maintenances(
    equipment_id: int = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    records = crud.get_maintenance_records(db, equipment_id=equipment_id, skip=skip, limit=limit)
    return records
