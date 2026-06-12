from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models import DocumentCategory, RiskLevel, GapStatus


class DocumentTypeBase(BaseModel):
    name: str
    category: DocumentCategory
    description: Optional[str] = None
    is_required: bool = True
    due_day: Optional[int] = None


class DocumentTypeCreate(DocumentTypeBase):
    pass


class DocumentTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[DocumentCategory] = None
    description: Optional[str] = None
    is_required: Optional[bool] = None
    due_day: Optional[int] = None


class DocumentTypeResponse(DocumentTypeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerBase(BaseModel):
    name: str
    tax_id: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentRequirementBase(BaseModel):
    customer_id: int
    document_type_id: int
    period: str
    is_required: bool = True
    notes: Optional[str] = None


class DocumentRequirementCreate(DocumentRequirementBase):
    pass


class DocumentRequirementResponse(DocumentRequirementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentSubmissionBase(BaseModel):
    customer_id: int
    document_type_id: int
    period: str
    submission_date: datetime
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    quantity: int = 1
    notes: Optional[str] = None
    submitted_by: Optional[str] = None


class DocumentSubmissionCreate(DocumentSubmissionBase):
    pass


class DocumentSubmissionResponse(DocumentSubmissionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentGapBase(BaseModel):
    customer_id: int
    document_type_id: int
    period: str
    status: GapStatus = GapStatus.PENDING
    risk_level: Optional[RiskLevel] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class DocumentGapCreate(DocumentGapBase):
    pass


class DocumentGapUpdate(BaseModel):
    status: Optional[GapStatus] = None
    risk_level: Optional[RiskLevel] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class DocumentGapResponse(DocumentGapBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CollectionRecordBase(BaseModel):
    customer_id: int
    document_gap_id: Optional[int] = None
    contact_date: datetime
    contact_method: Optional[str] = None
    contact_person_manager: Optional[str] = None
    content: Optional[str] = None
    customer_response: Optional[str] = None
    next_follow_up_date: Optional[datetime] = None


class CollectionRecordCreate(CollectionRecordBase):
    pass


class CollectionRecordResponse(CollectionRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RiskSummaryBase(BaseModel):
    customer_id: int
    period: str
    risk_level: RiskLevel
    risk_description: str
    affected_declaration: bool = True
    resolution_suggestion: Optional[str] = None
    is_resolved: bool = False


class RiskSummaryCreate(RiskSummaryBase):
    pass


class RiskSummaryResponse(RiskSummaryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerDocumentStatus(BaseModel):
    customer: CustomerResponse
    period: str
    required_documents: List[dict]
    submitted_documents: List[dict]
    gaps: List[DocumentGapResponse]


class RiskSummaryReport(BaseModel):
    customer_id: int
    customer_name: str
    period: str
    risk_level: RiskLevel
    risk_description: str
    affected_declaration: bool
    gaps: List[DocumentGapResponse]