from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.database import get_db
from app.models import (
    RiskSummary, DocumentGap, Customer, DocumentType, DocumentRequirement,
    DocumentSubmission, RiskLevel, GapStatus, DocumentCategory, CollectionRecord
)
from app.schemas import (
    RiskSummaryCreate, RiskSummaryResponse, RiskSummaryReport, 
    CustomerDocumentStatus, CategoryDocumentStatus, DocumentItemStatus,
    PendingCollectionItem, PendingCollectionResponse, CustomerPendingSummary
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
    
    collection_records = db.query(CollectionRecord).filter(
        CollectionRecord.customer_id == customer_id
    ).all()
    
    gap_collection_map = {}
    for record in collection_records:
        if record.document_gap_id:
            if record.document_gap_id not in gap_collection_map:
                gap_collection_map[record.document_gap_id] = []
            gap_collection_map[record.document_gap_id].append(record)
    
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
    
    pending_collection_count = 0
    high_risk_pending_count = 0
    
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
        
        last_collection_date = None
        last_contact_method = None
        last_contact_result = None
        next_follow_up_date = None
        
        if gap:
            records = gap_collection_map.get(gap.id, [])
            if records:
                latest_record = max(records, key=lambda r: r.contact_date)
                last_collection_date = latest_record.contact_date
                last_contact_method = latest_record.contact_method
                last_contact_result = latest_record.customer_response
                next_follow_up_date = latest_record.next_follow_up_date
        
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
            risk_level=gap_risk_level,
            last_collection_date=last_collection_date,
            last_contact_method=last_contact_method,
            last_contact_result=last_contact_result,
            next_follow_up_date=next_follow_up_date,
            pending_collection_count=0
        )
        
        category_items[doc_type.category.value].append(item)
    
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    pending_collections = gaps
    for gap in pending_collections:
        pending_collection_count += 1
        if gap.risk_level == RiskLevel.HIGH:
            high_risk_pending_count += 1
    
    customer_pending_collections = [
        g for g in pending_collections
        if g.due_date and g.due_date < today_end
    ]
    
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
    
    pending_collection_summary = {
        "total_pending": pending_collection_count,
        "high_risk_count": high_risk_pending_count,
        "overdue_count": sum(1 for g in pending_collections if g.status == GapStatus.OVERDUE),
        "pending_count": sum(1 for g in pending_collections if g.status == GapStatus.PENDING),
        "today_due_count": len(customer_pending_collections)
    }
    
    return CustomerDocumentStatus(
        customer=customer,
        period=period,
        categories=categories,
        overall_summary=overall_summary,
        risk_summary=risk_summary_data,
        pending_collection_summary=pending_collection_summary
    )


@router.get("/pending-collection/list", response_model=PendingCollectionResponse)
def get_pending_collection_list(
    customer_id: Optional[int] = None,
    period: Optional[str] = None,
    risk_level: Optional[RiskLevel] = None,
    category: Optional[str] = None,
    contact_method: Optional[str] = None,
    follow_up_start: Optional[str] = None,
    follow_up_end: Optional[str] = None,
    only_overdue: bool = False,
    need_follow_up: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(DocumentGap).filter(DocumentGap.status != GapStatus.SUBMITTED)
    
    if customer_id:
        query = query.filter(DocumentGap.customer_id == customer_id)
    if period:
        query = query.filter(DocumentGap.period == period)
    if risk_level:
        query = query.filter(DocumentGap.risk_level == risk_level)
    if only_overdue:
        query = query.filter(DocumentGap.status == GapStatus.OVERDUE)
    
    gaps = query.all()
    
    doc_types = {dt.id: dt for dt in db.query(DocumentType).all()}
    customers = {c.id: c for c in db.query(Customer).all()}
    
    collection_records = db.query(CollectionRecord).filter(
        CollectionRecord.document_gap_id.in_([g.id for g in gaps])
    ).all()
    
    gap_collection_map = {}
    for record in collection_records:
        if record.document_gap_id:
            if record.document_gap_id not in gap_collection_map:
                gap_collection_map[record.document_gap_id] = []
            gap_collection_map[record.document_gap_id].append(record)
    
    items = []
    overdue_count = 0
    pending_count = 0
    need_follow_up_count = 0
    high_risk_count = 0
    
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    follow_up_start_dt = None
    follow_up_end_dt = None
    if follow_up_start:
        follow_up_start_dt = datetime.strptime(follow_up_start, "%Y-%m-%d")
    if follow_up_end:
        follow_up_end_dt = datetime.strptime(follow_up_end, "%Y-%m-%d") + timedelta(days=1)
    
    for gap in gaps:
        customer = customers.get(gap.customer_id)
        doc_type = doc_types.get(gap.document_type_id)
        
        if not customer or not doc_type:
            continue
        
        if category and doc_type.category.value != category:
            continue
        
        records = gap_collection_map.get(gap.id, [])
        
        last_collection_date = None
        last_contact_method = None
        last_contact_result = None
        next_follow_up_date = None
        collection_count = len(records)
        
        if records:
            latest_record = max(records, key=lambda r: r.contact_date)
            last_collection_date = latest_record.contact_date
            last_contact_method = latest_record.contact_method
            last_contact_result = latest_record.customer_response
            next_follow_up_date = latest_record.next_follow_up_date
        
        if contact_method and last_contact_method != contact_method:
            continue
        
        if follow_up_start_dt or follow_up_end_dt:
            if next_follow_up_date is None:
                continue
            if follow_up_start_dt and next_follow_up_date < follow_up_start_dt:
                continue
            if follow_up_end_dt and next_follow_up_date >= follow_up_end_dt:
                continue
        
        is_overdue = gap.status == GapStatus.OVERDUE
        
        if is_overdue:
            overdue_count += 1
        else:
            pending_count += 1
        
        if gap.risk_level == RiskLevel.HIGH:
            high_risk_count += 1
        
        should_include = False
        if need_follow_up:
            if is_overdue:
                should_include = True
            elif next_follow_up_date and next_follow_up_date <= now:
                should_include = True
            elif next_follow_up_date is None and gap.due_date and gap.due_date <= now:
                should_include = True
            
            if not should_include:
                continue
        
        if should_include or not need_follow_up:
            if need_follow_up:
                need_follow_up_count += 1
            
            item = PendingCollectionItem(
                gap_id=gap.id,
                customer_id=customer.id,
                customer_name=customer.name,
                contact_person=customer.contact_person,
                contact_phone=customer.contact_phone,
                document_type_id=gap.document_type_id,
                document_type_name=doc_type.name,
                category=doc_type.category.value,
                period=gap.period,
                gap_status=gap.status.value,
                risk_level=gap.risk_level.value if gap.risk_level else None,
                due_date=gap.due_date,
                is_overdue=is_overdue,
                last_collection_date=last_collection_date,
                last_contact_method=last_contact_method,
                last_contact_result=last_contact_result,
                next_follow_up_date=next_follow_up_date,
                collection_count=collection_count,
                customer_response=last_contact_result
            )
            items.append(item)
    
    items = sorted(items, key=lambda x: (
        x.is_overdue, 
        x.risk_level == "高" if x.risk_level else False,
        x.next_follow_up_date or datetime.max
    ), reverse=True)
    
    customer_summary_map = {}
    for item in items:
        if item.customer_id not in customer_summary_map:
            customer_summary_map[item.customer_id] = {
                "customer_id": item.customer_id,
                "customer_name": item.customer_name,
                "contact_person": item.contact_person,
                "contact_phone": item.contact_phone,
                "total_pending": 0,
                "high_risk_count": 0,
                "medium_risk_count": 0,
                "overdue_count": 0,
                "today_follow_up_count": 0
            }
        
        customer_summary_map[item.customer_id]["total_pending"] += 1
        
        if item.risk_level == "高":
            customer_summary_map[item.customer_id]["high_risk_count"] += 1
        elif item.risk_level == "中":
            customer_summary_map[item.customer_id]["medium_risk_count"] += 1
        
        if item.is_overdue:
            customer_summary_map[item.customer_id]["overdue_count"] += 1
        
        if item.next_follow_up_date and today_start <= item.next_follow_up_date < today_end:
            customer_summary_map[item.customer_id]["today_follow_up_count"] += 1
    
    customer_summary = [
        CustomerPendingSummary(**summary)
        for summary in customer_summary_map.values()
    ]
    
    customer_summary = sorted(customer_summary, key=lambda x: (
        x.high_risk_count,
        x.overdue_count,
        x.today_follow_up_count
    ), reverse=True)
    
    total_count = len(items)
    
    return PendingCollectionResponse(
        items=items,
        customer_summary=customer_summary,
        total_count=total_count,
        overdue_count=overdue_count,
        pending_count=pending_count,
        need_follow_up_count=need_follow_up_count,
        high_risk_count=high_risk_count
    )
