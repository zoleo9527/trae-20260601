from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RoleEnum(str, Enum):
    pharmacist = "pharmacist"
    decoctor = "decoctor"
    courier = "courier"
    admin = "admin"


class StatusEnum(str, Enum):
    pending_pharmacist = "pending_pharmacist"
    pending_decoctor = "pending_decoctor"
    pending_courier = "pending_courier"
    pending_fee = "pending_fee"
    completed = "completed"
    rejected = "rejected"


class ReasonTypeEnum(str, Enum):
    prescription_error = "prescription_error"
    batch_confusion = "batch_confusion"
    address_error = "address_error"
    other = "other"


class UserBase(BaseModel):
    username: str
    name: str
    role: RoleEnum


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str


class LoginResponse(BaseModel):
    success: bool
    user: Optional[User] = None
    message: Optional[str] = None


class FeeConfirmationBase(BaseModel):
    decoction_fee: float = 0
    express_fee: float = 0
    material_fee: float = 0
    total_fee: float = 0
    is_patient_pay: bool = False
    payment_status: str = "pending"
    remark: Optional[str] = None


class FeeConfirmationCreate(FeeConfirmationBase):
    application_id: int


class FeeConfirmationUpdate(BaseModel):
    decoction_fee: Optional[float] = None
    express_fee: Optional[float] = None
    material_fee: Optional[float] = None
    total_fee: Optional[float] = None
    is_patient_pay: Optional[bool] = None
    payment_status: Optional[str] = None
    remark: Optional[str] = None


class FeeConfirmation(FeeConfirmationBase):
    id: int
    application_id: int
    confirmed_by: Optional[int] = None
    confirmed_at: Optional[datetime] = None
    has_modification_notice: bool = False
    last_modified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OperationLogBase(BaseModel):
    application_id: int
    action: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    remark: Optional[str] = None
    field_changes: Optional[str] = None


class OperationLog(OperationLogBase):
    id: int
    operator_id: int
    operator_name: str
    operator_role: str
    created_at: datetime

    class Config:
        from_attributes = True


class SupplementaryApplicationBase(BaseModel):
    prescription_no: str
    patient_name: str
    patient_phone: str
    address: str
    original_decoction_batch: str
    reason_type: ReasonTypeEnum
    reason_detail: str
    prescription_photo: Optional[str] = None
    decoction_label_photo: Optional[str] = None
    express_photo: Optional[str] = None


class SupplementaryApplicationCreate(SupplementaryApplicationBase):
    pass


class SupplementaryApplicationUpdate(BaseModel):
    prescription_no: Optional[str] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    address: Optional[str] = None
    original_decoction_batch: Optional[str] = None
    reason_type: Optional[ReasonTypeEnum] = None
    reason_detail: Optional[str] = None
    prescription_photo: Optional[str] = None
    decoction_label_photo: Optional[str] = None
    express_photo: Optional[str] = None


class StatusTransitionRequest(BaseModel):
    action: str  # approve, reject, submit_to_next
    remark: Optional[str] = None


class SupplementaryApplication(SupplementaryApplicationBase):
    id: int
    application_no: str
    status: str
    current_handler_role: str
    created_at: datetime
    updated_at: datetime
    due_date: Optional[datetime] = None
    is_overdue: bool = False
    is_modified: bool = False
    operation_logs: List[OperationLog] = []
    fee_confirmation: Optional[FeeConfirmation] = None

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    today_tasks: List[SupplementaryApplication]
    overdue_tasks: List[SupplementaryApplication]
    returned_tasks: List[SupplementaryApplication]
    all_tasks: List[SupplementaryApplication]


class ResetDataRequest(BaseModel):
    confirm: bool = False
