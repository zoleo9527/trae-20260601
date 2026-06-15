from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import RepairOrder, RepairRecord
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class RepairOrderCreate(BaseModel):
    customer_name: str
    phone: str
    device_model: str
    device_serial: Optional[str] = None
    problem_description: str
    priority: Optional[str] = "normal"
    created_by: str

class RepairOrderUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    problem_description: Optional[str] = None

class RepairRecordCreate(BaseModel):
    status: str
    description: str
    technician: str
    attachments: Optional[str] = None

@router.post("/")
async def create_repair_order(order: RepairOrderCreate, db: Session = Depends(get_db)):
    order_no = f"RO{datetime.now().strftime('%Y%m%d%H%M%S')}"
    db_order = RepairOrder(
        order_no=order_no,
        customer_name=order.customer_name,
        phone=order.phone,
        device_model=order.device_model,
        device_serial=order.device_serial,
        problem_description=order.problem_description,
        priority=order.priority,
        created_by=order.created_by,
        status="pending"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    record = RepairRecord(
        order_id=db_order.id,
        status="pending",
        description=f"工单创建，待分配维修师",
        technician=order.created_by
    )
    db.add(record)
    db.commit()
    
    return db_order

@router.get("/")
async def get_repair_orders(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(RepairOrder)
    if status:
        query = query.filter(RepairOrder.status == status)
    return query.all()

@router.get("/{order_id}")
async def get_repair_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    return order

@router.put("/{order_id}")
async def update_repair_order(order_id: int, update: RepairOrderUpdate, db: Session = Depends(get_db)):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    
    if update.status:
        order.status = update.status
    if update.assigned_to:
        order.assigned_to = update.assigned_to
    if update.problem_description:
        order.problem_description = update.problem_description
    
    db.commit()
    db.refresh(order)
    return order

@router.delete("/{order_id}")
async def delete_repair_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    db.delete(order)
    db.commit()
    return {"message": "工单已删除"}

@router.get("/{order_id}/records")
async def get_repair_records(order_id: int, db: Session = Depends(get_db)):
    records = db.query(RepairRecord).filter(RepairRecord.order_id == order_id).order_by(RepairRecord.created_at).all()
    return records

@router.post("/{order_id}/records")
async def create_repair_record(order_id: int, record: RepairRecordCreate, db: Session = Depends(get_db)):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    
    db_record = RepairRecord(
        order_id=order_id,
        status=record.status,
        description=record.description,
        technician=record.technician,
        attachments=record.attachments
    )
    db.add(db_record)
    
    order.status = record.status
    db.commit()
    db.refresh(db_record)
    
    return db_record
