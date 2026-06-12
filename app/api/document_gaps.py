from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DocumentGap, DocumentType, Customer, GapStatus, RiskLevel, DocumentCategory
from app.schemas import DocumentGapCreate, DocumentGapUpdate, DocumentGapResponse

router = APIRouter(prefix="/document-gaps", tags=["资料缺口管理"])


@router.post("/", response_model=DocumentGapResponse)
def create_document_gap(
    gap: DocumentGapCreate,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == gap.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    document_type = db.query(DocumentType).filter(DocumentType.id == gap.document_type_id).first()
    if not document_type:
        raise HTTPException(status_code=404, detail="资料项不存在")
    
    existing_gap = db.query(DocumentGap).filter(
        DocumentGap.customer_id == gap.customer_id,
        DocumentGap.document_type_id == gap.document_type_id,
        DocumentGap.period == gap.period
    ).first()
    
    if existing_gap:
        raise HTTPException(status_code=400, detail="该客户该期间的此资料缺口已存在")
    
    db_gap = DocumentGap(**gap.dict())
    db.add(db_gap)
    db.commit()
    db.refresh(db_gap)
    return db_gap


@router.get("/", response_model=List[DocumentGapResponse])
def list_document_gaps(
    customer_id: Optional[int] = None,
    period: Optional[str] = None,
    status: Optional[GapStatus] = None,
    risk_level: Optional[RiskLevel] = None,
    category: Optional[DocumentCategory] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(DocumentGap)
    
    if customer_id:
        query = query.filter(DocumentGap.customer_id == customer_id)
    if period:
        query = query.filter(DocumentGap.period == period)
    if status:
        query = query.filter(DocumentGap.status == status)
    if risk_level:
        query = query.filter(DocumentGap.risk_level == risk_level)
    if category:
        query = query.join(DocumentType).filter(DocumentType.category == category)
    
    gaps = query.offset(skip).limit(limit).all()
    return gaps


@router.get("/{gap_id}", response_model=DocumentGapResponse)
def get_document_gap(
    gap_id: int,
    db: Session = Depends(get_db)
):
    gap = db.query(DocumentGap).filter(DocumentGap.id == gap_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="资料缺口不存在")
    return gap


@router.put("/{gap_id}", response_model=DocumentGapResponse)
def update_document_gap(
    gap_id: int,
    gap_update: DocumentGapUpdate,
    db: Session = Depends(get_db)
):
    db_gap = db.query(DocumentGap).filter(DocumentGap.id == gap_id).first()
    if not db_gap:
        raise HTTPException(status_code=404, detail="资料缺口不存在")
    
    update_data = gap_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_gap, key, value)
    
    db.commit()
    db.refresh(db_gap)
    return db_gap


@router.delete("/{gap_id}")
def delete_document_gap(
    gap_id: int,
    db: Session = Depends(get_db)
):
    db_gap = db.query(DocumentGap).filter(DocumentGap.id == gap_id).first()
    if not db_gap:
        raise HTTPException(status_code=404, detail="资料缺口不存在")
    
    db.delete(db_gap)
    db.commit()
    return {"message": "资料缺口已删除"}


@router.post("/batch-mark", response_model=List[DocumentGapResponse])
def batch_mark_gaps(
    customer_id: int,
    period: str,
    document_type_ids: List[int],
    risk_level: Optional[RiskLevel] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    created_gaps = []
    for doc_type_id in document_type_ids:
        document_type = db.query(DocumentType).filter(DocumentType.id == doc_type_id).first()
        if not document_type:
            continue
        
        existing_gap = db.query(DocumentGap).filter(
            DocumentGap.customer_id == customer_id,
            DocumentGap.document_type_id == doc_type_id,
            DocumentGap.period == period
        ).first()
        
        if existing_gap:
            continue
        
        gap = DocumentGap(
            customer_id=customer_id,
            document_type_id=doc_type_id,
            period=period,
            status=GapStatus.PENDING,
            risk_level=risk_level,
            notes=notes
        )
        db.add(gap)
        created_gaps.append(gap)
    
    db.commit()
    for gap in created_gaps:
        db.refresh(gap)
    
    return created_gaps