from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
from uuid import uuid4


class RoleType(str, Enum):
    PROJECT_MANAGER = "project_manager"
    TRANSLATOR = "translator"
    REVIEWER = "reviewer"


class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    PROBLEM = "problem"


class FeedbackStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    HANDLED = "handled"


class FeeStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"


class ProblemType(str, Enum):
    RESCHEDULE = "reschedule"
    SUPPLEMENT = "supplement"
    REJECT = "reject"


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    role: RoleType
    created_at: datetime = Field(default_factory=datetime.now)


class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    project_manager_id: str
    translator_id: str
    reviewer_id: str
    status: OrderStatus = OrderStatus.PENDING
    original_deadline: datetime
    actual_deadline: Optional[datetime] = None
    ledger: Optional[str] = None
    scene_records: Optional[str] = None
    screenshots: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class CustomerFeedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    feedback_content: str
    handler_id: Optional[str] = None
    handler_type: Optional[RoleType] = None
    status: FeedbackStatus = FeedbackStatus.PENDING
    internal_notes: Optional[str] = None
    responsibility_analysis: Optional[str] = None
    processing_result: Optional[str] = None
    related_fee_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    handled_at: Optional[datetime] = None


class FeeConfirmation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    feedback_id: Optional[str] = None
    problem_id: Optional[str] = None
    amount: float
    currency: str = "CNY"
    fee_type: str
    status: FeeStatus = FeeStatus.PENDING
    inherited_notes: Optional[str] = None
    confirmation_notes: Optional[str] = None
    confirmed_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    confirmed_at: Optional[datetime] = None


class StatusChange(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    entity_type: str
    entity_id: str
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: str
    change_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class ProblemRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    feedback_id: str
    problem_type: ProblemType
    original_data: Optional[str] = None
    new_data: Optional[str] = None
    reason: str
    status: str = "open"
    created_by: str
    created_at: datetime = Field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None


class ErrorCode(str, Enum):
    INVALID_STATUS_TRANSITION = "E001"
    FEEDBACK_NOT_HANDLED = "E002"
    FEE_ALREADY_CONFIRMED = "E003"
    UNAUTHORIZED_ACCESS = "E004"
    PROJECT_NOT_FOUND = "E005"
    FEEDBACK_NOT_FOUND = "E006"
    FEE_NOT_FOUND = "E007"
    INVALID_ROLE = "E008"
    MISSING_REQUIRED_FIELD = "E009"
    DUPLICATE_OPERATION = "E010"
    RESCHEDULE_NOT_ALLOWED = "E011"
    SUPPLEMENT_NOT_ALLOWED = "E012"
    REJECT_REASON_REQUIRED = "E013"
    PROBLEM_NOT_FOUND = "E014"
    USER_NOT_FOUND = "E015"


ERROR_CODE_TO_HTTP_STATUS = {
    ErrorCode.INVALID_STATUS_TRANSITION: 400,
    ErrorCode.FEEDBACK_NOT_HANDLED: 400,
    ErrorCode.FEE_ALREADY_CONFIRMED: 400,
    ErrorCode.UNAUTHORIZED_ACCESS: 403,
    ErrorCode.PROJECT_NOT_FOUND: 404,
    ErrorCode.FEEDBACK_NOT_FOUND: 404,
    ErrorCode.FEE_NOT_FOUND: 404,
    ErrorCode.INVALID_ROLE: 403,
    ErrorCode.MISSING_REQUIRED_FIELD: 400,
    ErrorCode.DUPLICATE_OPERATION: 409,
    ErrorCode.RESCHEDULE_NOT_ALLOWED: 400,
    ErrorCode.SUPPLEMENT_NOT_ALLOWED: 400,
    ErrorCode.REJECT_REASON_REQUIRED: 400,
    ErrorCode.PROBLEM_NOT_FOUND: 404,
    ErrorCode.USER_NOT_FOUND: 404,
}


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.now)

    def to_dict(self):
        return {
            "code": self.code,
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
