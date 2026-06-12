from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.models import (
    RiskSummary, DocumentGap, Customer, DocumentType, DocumentRequirement,
    DocumentSubmission, RiskLevel, GapStatus, DocumentCategory
)
from app.schemas import (
    RiskSummaryCreate, RiskSummaryResponse, RiskSummaryReport, 
    CustomerDocumentStatus, CategoryDocumentStatus, DocumentItemStatus
)

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
    period: Optional[str] = None,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    if not period:
        period = datetime.now().strftime("%Y-%m")
    
    requirements = db.query(DocumentRequirement).filter(
        DocumentRequirement.customer_id == customer_id,
        DocumentRequirement.period == period
    ).all()
    
    submissions = db.query(DocumentSubmission).filter(
        DocumentSubmission.customer_id == customer_id,
        DocumentSubmission.period == period
    ).all()
    
    gaps = db.query(DocumentGap).filter(
        DocumentGap.customer_id == customer_id,
        DocumentGap.period == period
    ).all()
    
    risk_summary = db.query(RiskSummary).filter(
        RiskSummary.customer_id == customer_id,
        RiskSummary.period == period
    ).first()
    
    doc_types = {dt.id: dt for dt in db.query(DocumentType).all()}
    
    submission_map = {}
    for s in submissions:
        key = (s.document_type_id, s.period)
        submission_map[key] = s
    
    gap_map = {}
    for g in gaps:
        key = (g.document_type_id, g.period)
        gap_map[key] = g
    
    category_items = {}
    for cat in DocumentCategory:
        category_items[cat.value] = []
    
    for req in requirements:
        doc_type = doc_types.get(req.document_type_id)
        if not doc_type:
            continue
        
        key = (req.document_type_id, period)
        submission = submission_map.get(key)
        gap = gap_map.get(key)
        
        gap_status = gap.status.value if gap else None
        gap_risk_level = gap.risk_level.value if gap and gap.risk_level else None
        gap_notes = gap.notes if gap else None
        
        item = DocumentItemStatus(
            document_type_id=req.document_type_id,
            document_type_name=doc_type.name,
            category=doc_type.category.value,
            is_required=req.is_required,
            due_day=doc_type.due_day,
            due_date=gap.due_date if gap else None,
            submitted=submission is not None,
            submitted_date=submission.submission_date if submission else None,
            submitted_quantity=submission.quantity if submission else 0,
            submitted_by=submission.submitted_by if submission else None,
            gap_status=gap_status,
            gap_risk_level=gap_risk_level,
            gap_notes=gap_notes,
            has_risk=(gap_risk_level is not None),
            risk_level=gap_risk_level
        )
        
        category_items[doc_type.category.value].append(item)
    
    categories = []
    total_required = 0
    total_submitted = 0
    total_pending = 0
    total_overdue = 0
    
    category_labels = {
        "发票": "发票",
        "银行回单": "银行回单",
        "工资表": "工资表",
        "合同": "合同",
        "库存表": "库存表"
    }
    
    for cat_value, items in category_items.items():
        if not items:
            continue
        
        submitted_count = sum(1 for item in items if item.submitted)
        pending_count = sum(1 for item in items if item.gap_status == "待提交")
        overdue_count = sum(1 for item in items if item.gap_status == "逾期未交")
        req_count = sum(1 for item in items if item.is_required)
        
        total_required += req_count
        total_submitted += submitted_count
        total_pending += pending_count
        total_overdue += overdue_count
        
        category = CategoryDocumentStatus(
            category=cat_value,
            category_label=category_labels.get(cat_value, cat_value),
            total_required=req_count,
            submitted_count=submitted_count,
            pending_count=pending_count,
            overdue_count=overdue_count,
            items=items
        )
        categories.append(category)
    
    overall_summary = {
        "total_required": total_required,
        "total_submitted": total_submitted,
        "total_pending": total_pending,
        "total_overdue": total_overdue,
        "completion_rate": round((total_submitted / total_required) * 100, 2) if total_required > 0 else 0
    }
    
    risk_summary_data = None
    if risk_summary:
        risk_summary_data = {
            "risk_level": risk_summary.risk_level.value,
            "risk_description": risk_summary.risk_description,
            "affected_declaration": risk_summary.affected_declaration,
            "is_resolved": risk_summary.is_resolved,
            "resolution_suggestion": risk_summary.resolution_suggestion
        }
    
    return CustomerDocumentStatus(
        customer=customer,
        period=period,
        categories=categories,
        overall_summary=overall_summary,
        risk_summary=risk_summary_data
    )