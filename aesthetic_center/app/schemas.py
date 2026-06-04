from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class AuditLogBase(BaseModel):
    entity_type: str
    entity_id: int
    action: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    change_reason: Optional[str] = None
    operator_id: int
    operator_name: str


class AuditLogCreate(AuditLogBase):
    pass


class AuditLog(AuditLogBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    name: str
    role: str
    department: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class CustomerBase(BaseModel):
    name: str
    phone: str
    gender: Optional[str] = None
    age: Optional[int] = None
    consultation_type: str
    source_channel: Optional[str] = None
    status: str = "new"


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    consultation_type: Optional[str] = None
    source_channel: Optional[str] = None
    status: Optional[str] = None


class Customer(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ConsultationRecordBase(BaseModel):
    customer_id: int
    consultation_date: datetime
    consultant_id: int
    consultant_name: str
    chief_complaint: str
    medical_history: Optional[str] = None
    aesthetic_expectation: str
    recommended_projects: List[str] = []
    promised_caliber: Optional[str] = None
    risk_notes: Optional[str] = None
    status: str = "draft"


class ConsultationRecordCreate(ConsultationRecordBase):
    pass


class ConsultationRecordUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    recommended_projects: Optional[List[str]] = None
    promised_caliber: Optional[str] = None
    risk_notes: Optional[str] = None
    status: Optional[str] = None
    change_reason: str


class ConsultationRecord(ConsultationRecordBase):
    id: int
    current_version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class QuotationSchemeBase(BaseModel):
    customer_id: int
    consultation_record_id: Optional[int] = None
    scheme_name: str
    total_amount: float = 0
    discount_amount: float = 0
    actual_amount: float = 0
    payment_method: Optional[str] = None
    installment_months: Optional[int] = None
    installment_amount: Optional[float] = None
    project_items: List[dict] = []
    promised_services: List[str] = []
    special_notes: Optional[str] = None
    status: str = "draft"
    created_by: int
    created_by_name: str


class QuotationSchemeCreate(QuotationSchemeBase):
    pass


class QuotationSchemeUpdate(BaseModel):
    scheme_name: Optional[str] = None
    total_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    payment_method: Optional[str] = None
    installment_months: Optional[int] = None
    installment_amount: Optional[float] = None
    project_items: Optional[List[dict]] = None
    promised_services: Optional[List[str]] = None
    special_notes: Optional[str] = None
    status: Optional[str] = None
    change_reason: str


class QuotationScheme(QuotationSchemeBase):
    id: int
    current_version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class PostOperativeFollowUpBase(BaseModel):
    customer_id: int
    surgery_date: datetime
    surgery_projects: List[str] = []
    surgeon: Optional[str] = None
    follow_up_stage: str
    follow_up_date: datetime
    follow_up_type: str
    follow_up_person_id: int
    follow_up_person_name: str
    recovery_status: str
    customer_feedback: str
    skin_condition: Optional[dict] = None
    pain_level: Optional[int] = None
    swelling_level: Optional[str] = None
    abnormal_symptoms: Optional[str] = None
    handling_advice: Optional[str] = None
    next_follow_up_date: Optional[datetime] = None
    has_discomfort: bool = False
    discomfort_report_id: Optional[int] = None
    status: str = "pending"


class PostOperativeFollowUpCreate(PostOperativeFollowUpBase):
    pass


class PostOperativeFollowUpUpdate(BaseModel):
    recovery_status: Optional[str] = None
    customer_feedback: Optional[str] = None
    abnormal_symptoms: Optional[str] = None
    handling_advice: Optional[str] = None
    next_follow_up_date: Optional[datetime] = None
    has_discomfort: Optional[bool] = None
    discomfort_report_id: Optional[int] = None
    status: Optional[str] = None
    change_reason: str


class PostOperativeFollowUp(PostOperativeFollowUpBase):
    id: int
    current_version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class DiscomfortReportBase(BaseModel):
    customer_id: int
    report_date: datetime
    reporter: str
    reporter_phone: Optional[str] = None
    discomfort_type: str
    discomfort_symptoms: str
    severity: str
    related_projects: List[str] = []
    related_surgery_date: Optional[datetime] = None
    abnormal_description: Optional[str] = None
    status: str = "pending"


class DiscomfortReportCreate(DiscomfortReportBase):
    pass


class HandlingRecordCreate(BaseModel):
    handler_id: int
    handler_name: str
    handling_action: str
    handling_notes: str
    next_step: Optional[str] = None
    notify_customer: bool = False
    notify_method: Optional[str] = None
    attachment_count: int = 0
    new_status: str


class DiscomfortReport(DiscomfortReportBase):
    id: int
    first_handler_id: Optional[int] = None
    first_handler_name: Optional[str] = None
    first_handling_time: Optional[datetime] = None
    current_handler_id: Optional[int] = None
    current_handler_name: Optional[str] = None
    is_closed: bool = False
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class HandlingRecordBase(BaseModel):
    discomfort_report_id: int
    handler_id: int
    handler_name: str
    handling_action: str
    handling_notes: str
    previous_status: Optional[str] = None
    new_status: str
    next_step: Optional[str] = None
    notify_customer: bool = False
    notify_method: Optional[str] = None
    attachment_count: int = 0


class HandlingRecord(HandlingRecordBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
