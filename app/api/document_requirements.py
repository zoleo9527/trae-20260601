from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DocumentRequirement, Customer, DocumentType
from app.schemas import DocumentRequirementCreate, DocumentRequirementResponse

router = APIRouter(prefix="/document-requirements", tags=["应交资料项管理"])


@router.post("/", response_model=DocumentRequirementResponse)
def create_document_requirement(
    requirement: DocumentRequirementCreate,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == requirement.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    document_type = db.query(DocumentType).filter(DocumentType.id == requirement.document_type_id).first()
    if not document_type:
        raise HTTPException(status_code=404, detail="资料项不存在")
    
    existing_requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.customer_id == requirement.customer_id,
        DocumentRequirement.document_type_id == requirement.document_type_id,
        DocumentRequirement.period == requirement.period
    ).first()
    
    if existing_requirement:
        raise HTTPException(status_code=400, detail="该客户该期间的此资料项要求已存在")
    
    db_requirement = DocumentRequirement(**requirement.dict())
    db.add(db_requirement)
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


@router.get("/", response_model=List[DocumentRequirementResponse])
def list_document_requirements(
    customer_id: Optional[int] = None,
    period: Optional[str] = None,
    document_type_id: Optional[int] = None,
    is_required: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(DocumentRequirement)
    
    if customer_id:
        query = query.filter(DocumentRequirement.customer_id == customer_id)
    if period:
        query = query.filter(DocumentRequirement.period == period)
    if document_type_id:
        query = query.filter(DocumentRequirement.document_type_id == document_type_id)
    if is_required is not None:
        query = query.filter(DocumentRequirement.is_required == is_required)
    
    requirements = query.offset(skip).limit(limit).all()
    return requirements


@router.get("/{requirement_id}", response_model=DocumentRequirementResponse)
def get_document_requirement(
    requirement_id: int,
    db: Session = Depends(get_db)
):
    requirement = db.query(DocumentRequirement).filter(DocumentRequirement.id == requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="资料项要求不存在")
    return requirement


@router.put("/{requirement_id}", response_model=DocumentRequirementResponse)
def update_document_requirement(
    requirement_id: int,
    is_required: Optional[bool] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    db_requirement = db.query(DocumentRequirement).filter(DocumentRequirement.id == requirement_id).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="资料项要求不存在")
    
    if is_required is not None:
        db_requirement.is_required = is_required
    if notes is not None:
        db_requirement.notes = notes
    
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


@router.delete("/{requirement_id}")
def delete_document_requirement(
    requirement_id: int,
    db: Session = Depends(get_db)
):
    db_requirement = db.query(DocumentRequirement).filter(DocumentRequirement.id == requirement_id).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="资料项要求不存在")
    
    db.delete(db_requirement)
    db.commit()
    return {"message": "资料项要求已删除"}


@router.post("/batch-create", response_model=List[DocumentRequirementResponse])
def batch_create_requirements(
    customer_id: int,
    period: str,
    document_type_ids: List[int],
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    created_requirements = []
    for doc_type_id in document_type_ids:
        document_type = db.query(DocumentType).filter(DocumentType.id == doc_type_id).first()
        if not document_type:
            continue
        
        existing_requirement = db.query(DocumentRequirement).filter(
            DocumentRequirement.customer_id == customer_id,
            DocumentRequirement.document_type_id == doc_type_id,
            DocumentRequirement.period == period
        ).first()
        
        if existing_requirement:
            continue
        
        requirement = DocumentRequirement(
            customer_id=customer_id,
            document_type_id=doc_type_id,
            period=period,
            is_required=document_type.is_required,
            notes=notes
        )
        db.add(requirement)
        created_requirements.append(requirement)
    
    db.commit()
    for requirement in created_requirements:
        db.refresh(requirement)
    
    return created_requirements


@router.get("/customer-period/{customer_id}/{period}", response_model=List[DocumentRequirementResponse])
def get_customer_period_requirements(
    customer_id: int,
    period: str,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    requirements = db.query(DocumentRequirement).filter(
        DocumentRequirement.customer_id == customer_id,
        DocumentRequirement.period == period
    ).all()
    
    return requirements