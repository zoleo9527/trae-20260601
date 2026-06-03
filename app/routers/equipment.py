from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db
from app.models import EquipmentStatus

router = APIRouter(prefix="/equipment", tags=["器材管理"])

@router.post("/", response_model=schemas.Equipment, summary="添加器材")
def create_equipment(equipment: schemas.EquipmentCreate, db: Session = Depends(get_db)):
    return crud.create_equipment(db=db, equipment=equipment)

@router.get("/", response_model=List[schemas.Equipment], summary="获取器材列表")
def read_equipments(skip: int = 0, limit: int = 100, status: EquipmentStatus = None, db: Session = Depends(get_db)):
    equipments = crud.get_equipments(db, skip=skip, limit=limit, status=status)
    return equipments

@router.get("/{equipment_id}", response_model=schemas.Equipment, summary="获取器材详情")
def read_equipment(equipment_id: int, db: Session = Depends(get_db)):
    db_equipment = crud.get_equipment(db, equipment_id=equipment_id)
    if db_equipment is None:
        raise HTTPException(status_code=404, detail="器材不存在")
    return db_equipment

@router.patch("/{equipment_id}/status", response_model=schemas.Equipment, summary="更新器材状态")
def update_equipment_status(equipment_id: int, status: EquipmentStatus, db: Session = Depends(get_db)):
    db_equipment = crud.update_equipment_status(db, equipment_id=equipment_id, status=status)
    if db_equipment is None:
        raise HTTPException(status_code=404, detail="器材不存在")
    return db_equipment
