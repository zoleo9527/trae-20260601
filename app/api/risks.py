from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.models import (
    RiskSummary, DocumentGap, Customer, DocumentType, 
    RiskLevel, GapStatus, DocumentCategory
)
from app.schemas import RiskSummaryCreate, RiskSummaryResponse, RiskSummaryReport, CustomerDocumentStatus

router = APIRouter(prefix="/risks", tags=["风险汇总管理"])


@router.post("/", response_model=RiskSummaryResponse)
def create_risk_summary(
    risk: RiskSummaryCreate,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == risk.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    db_risk = RiskSummary(**risk.dict())
    db.add(db_risk)
    db.commit()
    db.refresh(db_risk)
    return db_risk


@router.get("/", response_model=List[RiskSummaryResponse])
def list_risk_summaries(
    customer_id: Optional[int] = None,
    period: Optional[str] = None,
    risk_level: Optional[RiskLevel] = None,
    affected_declaration_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(RiskSummary)
    
    if customer_id:
        query = query.filter(RiskSummary.customer_id == customer_id)
    if period:
        query = query.filter(RiskSummary.period == period)
    if risk_level:
        query = query.filter(RiskSummary.risk_level == risk_level)
    if affected_declaration_only:
        query = query.filter(RiskSummary.affected_declaration == True)
    
    risks = query.order_by(RiskSummary.created_at.desc()).offset(skip).limit(limit).all()
    return risks


@router.get("/report", response_model=List[RiskSummaryReport])
def get_risk_report(
    period: Optional[str] = None,
    risk_level: Optional[RiskLevel] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RiskSummary).filter(RiskSummary.affected_declaration == True)
    
    if period:
        query = query.filter(RiskSummary.period == period)
    if risk_level:
        query = query.filter(RiskSummary.risk_level == risk_level)
    
    risks = query.all()
    
    reports = []
    for risk in risks:
        customer = db.query(Customer).filter(Customer.id == risk.customer_id).first()
        gaps = db.query(DocumentGap).filter(
            DocumentGap.customer_id == risk.customer_id,
            DocumentGap.period == risk.period
        ).all()
        
        report = RiskSummaryReport(
            customer_id=risk.customer_id,
            customer_name=customer.name if customer else "未知",
            period=risk.period,
            risk_level=risk.risk_level,
            risk_description=risk.risk_description,
            affected_declaration=risk.affected_declaration,
            gaps=gaps
        )
        reports.append(report)
    
    return reports


@router.get("/{risk_id}", response_model=RiskSummaryResponse)
def get_risk_summary(
    risk_id: int,
    db: Session = Depends(get_db)
):
    risk = db.query(RiskSummary).filter(RiskSummary.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="风险汇总不存在")
    return risk


@router.put("/{risk_id}", response_model=RiskSummaryResponse)
def update_risk_summary(
    risk_id: int,
    is_resolved: bool,
    db: Session = Depends(get_db)
):
    db_risk = db.query(RiskSummary).filter(RiskSummary.id == risk_id).first()
    if not db_risk:
        raise HTTPException(status_code=404, detail="风险汇总不存在")
    
    db_risk.is_resolved = is_resolved
    db.commit()
    db.refresh(db_risk)
    return db_risk


@router.delete("/{risk_id}")
def delete_risk_summary(
    risk_id: int,
    db: Session = Depends(get_db)
):
    db_risk = db.query(RiskSummary).filter(RiskSummary.id == risk_id).first()
    if not db_risk:
        raise HTTPException(status_code=404, detail="风险汇总不存在")
    
    db.delete(db_risk)
    db.commit()
    return {"message": "风险汇总已删除"}


@router.get("/customer-status/{customer_id}", response_model=CustomerDocumentStatus)
def get_customer_document_status(
    customer_id: int,
    period: str,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    gaps = db.query(DocumentGap).filter(
        DocumentGap.customer_id == customer_id,
        DocumentGap.period == period
    ).all()
    
    submissions = db.query(DocumentSubmission).filter(
        DocumentSubmission.customer_id == customer_id,
        DocumentSubmission.period == period
    ).all()
    
    required_docs = []
    for gap in gaps:
        doc_type = db.query(DocumentType).filter(DocumentType.id == gap.document_type_id).first()
        required_docs.append({
            "document_type": doc_type.name if doc_type else "未知",
            "category": doc_type.category.value if doc_type else "未知",
            "status": gap.status.value,
            "risk_level": gap.risk_level.value if gap.risk_level else None
        })
    
    submitted_docs = []
    for submission in submissions:
        doc_type = db.query(DocumentType).filter(DocumentType.id == submission.document_type_id).first()
        submitted_docs.append({
            "document_type": doc_type.name if doc_type else "未知",
            "category": doc_type.category.value if doc_type else "未知",
            "submission_date": submission.submission_date.strftime("%Y-%m-%d"),
            "quantity": submission.quantity
        })
    
    return CustomerDocumentStatus(
        customer=customer,
        period=period,
        required_documents=required_docs,
        submitted_documents=submitted_docs,
        gaps=gaps
    )


from app.models import DocumentSubmission