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


class DocumentItemStatus(BaseModel):
    document_type_id: int
    document_type_name: str
    category: str
    is_required: bool
    due_day: Optional[int]
    due_date: Optional[datetime]
    submitted: bool
    submitted_date: Optional[datetime]
    submitted_quantity: int = 0
    submitted_by: Optional[str]
    gap_status: Optional[str]
    gap_risk_level: Optional[str]
    gap_notes: Optional[str]
    has_risk: bool = False
    risk_level: Optional[str]
    last_collection_date: Optional[datetime] = None
    last_contact_method: Optional[str] = None
    last_contact_result: Optional[str] = None
    next_follow_up_date: Optional[datetime] = None


class CategoryDocumentStatus(BaseModel):
    category: str
    category_label: str
    total_required: int
    submitted_count: int
    pending_count: int
    overdue_count: int
    items: List[DocumentItemStatus]


class CustomerDocumentStatus(BaseModel):
    customer: CustomerResponse
    period: str
    categories: List[CategoryDocumentStatus]
    overall_summary: dict
    risk_summary: Optional[dict]


class RiskSummaryReport(BaseModel):
    customer_id: int
    customer_name: str
    period: str
    risk_level: RiskLevel
    risk_description: str
    affected_declaration: bool
    gaps: List[DocumentGapResponse]


class PendingCollectionItem(BaseModel):
    gap_id: int
    customer_id: int
    customer_name: str
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    document_type_id: int
    document_type_name: str
    category: str
    period: str
    gap_status: str
    risk_level: Optional[str]
    due_date: Optional[datetime]
    is_overdue: bool
    last_collection_date: Optional[datetime] = None
    last_contact_method: Optional[str] = None
    last_contact_result: Optional[str] = None
    next_follow_up_date: Optional[datetime] = None
    collection_count: int = 0
    customer_response: Optional[str] = None


class PendingCollectionResponse(BaseModel):
    items: List[PendingCollectionItem]
    total_count: int
    overdue_count: int
    pending_count: int
    need_follow_up_count: int
