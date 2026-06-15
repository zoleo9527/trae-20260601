from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import SparePart, SparePartIssue, RepairOrder, RepairRecord
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class SparePartCreate(BaseModel):
    part_code: str
    part_name: str
    category: str
    stock: int = 0
    unit_price: float
    supplier: Optional[str] = None
    location: Optional[str] = None
    min_stock: int = 10

class SparePartIssueCreate(BaseModel):
    part_id: int
    quantity: int
    issued_by: str
    reason: Optional[str] = None

class SparePartReturn(BaseModel):
    returned_by: str
    reason: Optional[str] = None

@router.post("/")
async def create_spare_part(part: SparePartCreate, db: Session = Depends(get_db)):
    existing = db.query(SparePart).filter(SparePart.part_code == part.part_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="备件编号已存在")
    
    db_part = SparePart(**part.dict())
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

@router.get("/")
async def get_spare_parts(category: Optional[str] = None, low_stock: Optional[bool] = False, db: Session = Depends(get_db)):
    query = db.query(SparePart)
    if category:
        query = query.filter(SparePart.category == category)
    if low_stock:
        query = query.filter(SparePart.stock <= SparePart.min_stock)
    return query.all()

@router.get("/{part_id}")
async def get_spare_part(part_id: int, db: Session = Depends(get_db)):
    part = db.query(SparePart).filter(SparePart.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="备件不存在")
    return part

@router.put("/{part_id}")
async def update_spare_part(part_id: int, part: SparePartCreate, db: Session = Depends(get_db)):
    db_part = db.query(SparePart).filter(SparePart.id == part_id).first()
    if not db_part:
        raise HTTPException(status_code=404, detail="备件不存在")
    
    db_part.part_name = part.part_name
    db_part.category = part.category
    db_part.stock = part.stock
    db_part.unit_price = part.unit_price
    db_part.supplier = part.supplier
    db_part.location = part.location
    db_part.min_stock = part.min_stock
    
    db.commit()
    db.refresh(db_part)
    return db_part

@router.delete("/{part_id}")
async def delete_spare_part(part_id: int, db: Session = Depends(get_db)):
    part = db.query(SparePart).filter(SparePart.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="备件不存在")
    db.delete(part)
    db.commit()
    return {"message": "备件已删除"}

@router.post("/issue/{order_id}")
async def issue_spare_part(order_id: int, issue: SparePartIssueCreate, db: Session = Depends(get_db)):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    
    part = db.query(SparePart).filter(SparePart.id == issue.part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="备件不存在")
    
    if part.stock < issue.quantity:
        raise HTTPException(status_code=400, detail="库存不足")
    
    part.stock -= issue.quantity
    
    db_issue = SparePartIssue(
        order_id=order_id,
        part_id=issue.part_id,
        quantity=issue.quantity,
        issued_by=issue.issued_by,
        reason=issue.reason
    )
    db.add(db_issue)
    
    record = RepairRecord(
        order_id=order_id,
        status=order.status,
        description=f"领用备件: {part.part_name} x {issue.quantity}",
        technician=issue.issued_by
    )
    db.add(record)
    
    db.commit()
    db.refresh(db_issue)
    
    return db_issue

@router.get("/issue/{order_id}")
async def get_order_issues(order_id: int, db: Session = Depends(get_db)):
    issues = db.query(SparePartIssue).filter(SparePartIssue.order_id == order_id).all()
    return issues

@router.post("/return/{issue_id}")
async def return_spare_part(issue_id: int, return_data: SparePartReturn, db: Session = Depends(get_db)):
    issue = db.query(SparePartIssue).filter(SparePartIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="领用记录不存在")
    
    if issue.returned:
        raise HTTPException(status_code=400, detail="该备件已归还")
    
    part = db.query(SparePart).filter(SparePart.id == issue.part_id).first()
    part.stock += issue.quantity
    
    issue.returned = True
    issue.returned_at = datetime.now()
    issue.returned_by = return_data.returned_by
    issue.reason = return_data.reason
    
    record = RepairRecord(
        order_id=issue.order_id,
        status="returned",
        description=f"归还备件: {part.part_name} x {issue.quantity}",
        technician=return_data.returned_by
    )
    db.add(record)
    
    db.commit()
    db.refresh(issue)
    return issue

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    categories = db.query(SparePart.category).distinct().all()
    return [c[0] for c in categories if c[0]]
