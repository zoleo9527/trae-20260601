from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DocumentType
from app.schemas import DocumentTypeCreate, DocumentTypeUpdate, DocumentTypeResponse

router = APIRouter(prefix="/document-types", tags=["资料项配置"])


@router.post("/", response_model=DocumentTypeResponse)
def create_document_type(
    document_type: DocumentTypeCreate,
    db: Session = Depends(get_db)
):
    db_document_type = DocumentType(**document_type.dict())
    db.add(db_document_type)
    db.commit()
    db.refresh(db_document_type)
    return db_document_type


@router.get("/", response_model=List[DocumentTypeResponse])
def list_document_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    document_types = db.query(DocumentType).offset(skip).limit(limit).all()
    return document_types


@router.get("/{document_type_id}", response_model=DocumentTypeResponse)
def get_document_type(
    document_type_id: int,
    db: Session = Depends(get_db)
):
    document_type = db.query(DocumentType).filter(DocumentType.id == document_type_id).first()
    if not document_type:
        raise HTTPException(status_code=404, detail="资料项不存在")
    return document_type


@router.put("/{document_type_id}", response_model=DocumentTypeResponse)
def update_document_type(
    document_type_id: int,
    document_type_update: DocumentTypeUpdate,
    db: Session = Depends(get_db)
):
    db_document_type = db.query(DocumentType).filter(DocumentType.id == document_type_id).first()
    if not db_document_type:
        raise HTTPException(status_code=404, detail="资料项不存在")
    
    update_data = document_type_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_document_type, key, value)
    
    db.commit()
    db.refresh(db_document_type)
    return db_document_type


@router.delete("/{document_type_id}")
def delete_document_type(
    document_type_id: int,
    db: Session = Depends(get_db)
):
    db_document_type = db.query(DocumentType).filter(DocumentType.id == document_type_id).first()
    if not db_document_type:
        raise HTTPException(status_code=404, detail="资料项不存在")
    
    db.delete(db_document_type)
    db.commit()
    return {"message": "资料项已删除"}