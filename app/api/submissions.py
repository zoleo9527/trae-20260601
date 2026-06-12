from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DocumentSubmission, DocumentGap, GapStatus, Customer, DocumentType
from app.schemas import DocumentSubmissionCreate, DocumentSubmissionResponse

router = APIRouter(prefix="/submissions", tags=["客户补交管理"])


@router.post("/", response_model=DocumentSubmissionResponse)
def create_submission(
    submission: DocumentSubmissionCreate,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == submission.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    document_type = db.query(DocumentType).filter(DocumentType.id == submission.document_type_id).first()
    if not document_type:
        raise HTTPException(status_code=404, detail="资料项不存在")
    
    db_submission = DocumentSubmission(**submission.dict())
    db.add(db_submission)
    
    gap = db.query(DocumentGap).filter(
        DocumentGap.customer_id == submission.customer_id,
        DocumentGap.document_type_id == submission.document_type_id,
        DocumentGap.period == submission.period
    ).first()
    
    if gap:
        gap.status = GapStatus.SUBMITTED
        gap.notes = f"{gap.notes or ''}\n客户于 {submission.submission_date.strftime('%Y-%m-%d')} 补交资料".strip()
    
    db.commit()
    db.refresh(db_submission)
    return db_submission


@router.get("/", response_model=List[DocumentSubmissionResponse])
def list_submissions(
    customer_id: Optional[int] = None,
    period: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(DocumentSubmission)
    
    if customer_id:
        query = query.filter(DocumentSubmission.customer_id == customer_id)
    if period:
        query = query.filter(DocumentSubmission.period == period)
    
    submissions = query.order_by(DocumentSubmission.submission_date.desc()).offset(skip).limit(limit).all()
    return submissions


@router.get("/{submission_id}", response_model=DocumentSubmissionResponse)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db)
):
    submission = db.query(DocumentSubmission).filter(DocumentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="补交记录不存在")
    return submission


@router.delete("/{submission_id}")
def delete_submission(
    submission_id: int,
    db: Session = Depends(get_db)
):
    db_submission = db.query(DocumentSubmission).filter(DocumentSubmission.id == submission_id).first()
    if not db_submission:
        raise HTTPException(status_code=404, detail="补交记录不存在")
    
    db.delete(db_submission)
    db.commit()
    return {"message": "补交记录已删除"}