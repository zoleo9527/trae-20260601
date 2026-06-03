from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db
from app.models import RentalStatus

router = APIRouter(prefix="/rental", tags=["租赁管理"])

@router.post("/", response_model=schemas.RentalRecord, summary="创建器材预约")
def create_rental(
    rental: schemas.RentalRecordCreate, 
    x_user_id: int = Header(..., description="操作用户ID"),
    db: Session = Depends(get_db)
):
    db_rental = crud.create_rental_record(db=db, rental=rental, user_id=x_user_id)
    if db_rental is None:
        raise HTTPException(status_code=400, detail="创建预约失败，请检查器材是否存在")
    return db_rental

@router.get("/", response_model=List[schemas.RentalRecord], summary="获取租赁记录列表")
def read_rentals(
    skip: int = 0, 
    limit: int = 100, 
    status: RentalStatus = None, 
    db: Session = Depends(get_db)
):
    rentals = crud.get_rental_records(db, skip=skip, limit=limit, status=status)
    return rentals

@router.get("/{rental_id}", response_model=schemas.RentalRecordDetail, summary="获取租赁记录详情")
def read_rental(rental_id: int, db: Session = Depends(get_db)):
    db_rental = crud.get_rental_record(db, rental_id=rental_id)
    if db_rental is None:
        raise HTTPException(status_code=404, detail="租赁记录不存在")
    
    history = crud.get_status_history(db, rental_id=rental_id)
    result = schemas.RentalRecordDetail.model_validate(db_rental)
    result.status_history = history
    return result

@router.patch("/{rental_id}/status", response_model=schemas.RentalRecord, summary="状态变更")
def change_rental_status(
    rental_id: int,
    status_request: schemas.StatusChangeRequest,
    x_user_id: int = Header(..., description="操作用户ID"),
    db: Session = Depends(get_db)
):
    db_rental = crud.change_rental_status(
        db, 
        rental_id=rental_id, 
        new_status=status_request.new_status,
        user_id=x_user_id,
        remark=status_request.remark,
        deposit_refund_reason=status_request.deposit_refund_reason
    )
    if db_rental is None:
        raise HTTPException(status_code=404, detail="租赁记录不存在")
    return db_rental

@router.put("/{rental_id}", response_model=schemas.RentalRecord, summary="更新租赁记录")
def update_rental(
    rental_id: int,
    update_data: schemas.RentalRecordUpdate,
    db: Session = Depends(get_db)
):
    db_rental = crud.update_rental_record(db, rental_id=rental_id, update_data=update_data)
    if db_rental is None:
        raise HTTPException(status_code=404, detail="租赁记录不存在")
    return db_rental

@router.get("/{rental_id}/history", response_model=List[schemas.StatusHistory], summary="获取状态历史")
def read_rental_history(rental_id: int, db: Session = Depends(get_db)):
    history = crud.get_status_history(db, rental_id=rental_id)
    return history
