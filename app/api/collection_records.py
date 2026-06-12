from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CollectionRecord, Customer, DocumentGap
from app.schemas import CollectionRecordCreate, CollectionRecordResponse

router = APIRouter(prefix="/collection-records", tags=["催交记录管理"])


@router.post("/", response_model=CollectionRecordResponse)
def create_collection_record(
    record: CollectionRecordCreate,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == record.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    if record.document_gap_id:
        gap = db.query(DocumentGap).filter(DocumentGap.id == record.document_gap_id).first()
        if not gap:
            raise HTTPException(status_code=404, detail="资料缺口不存在")
    
    db_record = CollectionRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/", response_model=List[CollectionRecordResponse])
def list_collection_records(
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(CollectionRecord)
    
    if customer_id:
        query = query.filter(CollectionRecord.customer_id == customer_id)
    
    records = query.order_by(CollectionRecord.contact_date.desc()).offset(skip).limit(limit).all()
    return records


@router.get("/{record_id}", response_model=CollectionRecordResponse)
def get_collection_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(CollectionRecord).filter(CollectionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="催交记录不存在")
    return record


@router.delete("/{record_id}")
def delete_collection_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    db_record = db.query(CollectionRecord).filter(CollectionRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="催交记录不存在")
    
    db.delete(db_record)
    db.commit()
    return {"message": "催交记录已删除"}