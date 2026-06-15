from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Literal

class User(BaseModel):
    id: str
    name: str
    role: Literal["dispatcher", "technician", "customer_service"]
    phone: str

class Accessory(BaseModel):
    id: str
    name: str
    quantity: int
    used: bool = False
    installed: bool = False
    remark: str = ""

class InstallationPhoto(BaseModel):
    id: str
    order_id: str
    photo_url: str
    description: str
    photo_type: Literal["before", "during", "after", "leakage", "rework"] = "after"
    uploaded_at: datetime
    uploaded_by: str

class AfterSalesRecord(BaseModel):
    id: str
    order_id: str
    type: Literal["leakage", "damage", "other"]
    description: str
    photos: List[str] = []
    reported_at: datetime
    reported_by: str
    status: Literal["pending", "processing", "resolved", "rejected"] = "pending"
    rejected_reason: Optional[str] = None

class ResponsibilityResult(BaseModel):
    id: str
    order_id: str
    responsible_party: Literal["technician", "customer", "supplier", "company"]
    reason: str
    evidence: List[str] = []
    created_at: datetime
    created_by: str
    status: Literal["confirmed", "appeal", "final"] = "confirmed"
    compensation_amount: float = 0.0

class RejectionRecord(BaseModel):
    id: str
    liability_id: str
    order_id: str
    reason: str
    rejected_by: str
    rejected_at: datetime
    additional_evidence_required: List[str] = []
    status: Literal["pending", "resolved"] = "pending"

class ProgressTracking(BaseModel):
    id: str
    order_id: str
    stage: str
    status: Literal["pending", "in_progress", "completed", "rejected"]
    operator_id: str
    operated_at: datetime
    notes: str = ""

class Alert(BaseModel):
    id: str
    type: Literal["leakage", "timeout", "rejection", "pending_liability"]
    order_id: str
    message: str
    severity: Literal["high", "medium", "low"]
    created_at: datetime
    is_read: bool = False

class Question(BaseModel):
    id: str
    order_id: str
    question: str
    asked_by: str
    asked_at: datetime
    answer: Optional[str] = None
    answered_by: Optional[str] = None
    answered_at: Optional[datetime] = None

class OrderStatus(str, Literal[
    "pending", "assigned", "accepted", "in_progress", "completed",
    "rework_requested", "rework_in_progress", "rework_completed",
    "liability_pending", "liability_done", "resolved"
]):
    pass

class Order(BaseModel):
    id: str
    customer_name: str
    customer_phone: str
    address: str
    product_type: str
    product_model: str = ""
    scheduled_date: datetime
    status: OrderStatus = "pending"
    technician_id: Optional[str] = None
    dispatcher_id: Optional[str] = None
    accessories: List[Accessory] = []
    photos: List[InstallationPhoto] = []
    after_sales_records: List[AfterSalesRecord] = []
    responsibility_result: Optional[ResponsibilityResult] = None
    rejection_records: List[RejectionRecord] = []
    progress_trackings: List[ProgressTracking] = []
    questions: List[Question] = []
    created_at: datetime
    updated_at: datetime

class LoginRequest(BaseModel):
    phone: str
    password: Optional[str] = None

class OrderCreateRequest(BaseModel):
    customer_name: str
    customer_phone: str
    address: str
    product_type: str
    product_model: str = ""
    scheduled_date: datetime

class OrderUpdateRequest(BaseModel):
    status: Optional[str] = None
    technician_id: Optional[str] = None
    accessories: Optional[List[Accessory]] = None

class AfterSalesCreateRequest(BaseModel):
    order_id: str
    type: Literal["leakage", "damage", "other"] = "leakage"
    description: str
    photos: List[str] = []

class ResponsibilityJudgmentRequest(BaseModel):
    order_id: str
    responsible_party: Literal["technician", "customer", "supplier", "company"]
    reason: str
    evidence: List[str] = []
    compensation_amount: float = 0.0

class RejectLiabilityRequest(BaseModel):
    reason: str
    additional_evidence_required: List[str] = []

class AskQuestionRequest(BaseModel):
    question: str

class AnswerQuestionRequest(BaseModel):
    answer: str