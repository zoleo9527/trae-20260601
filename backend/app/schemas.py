from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Union


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    real_name: str
    role: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserBase(BaseModel):
    username: str
    real_name: str
    role: Optional[str] = "staff"


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PropertyBase(BaseModel):
    property_no: str
    building: str
    floor: str
    room_no: str
    area: float
    layout: Optional[str] = None
    decoration: Optional[str] = None
    daily_rent: Optional[float] = None
    monthly_rent: Optional[float] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyVacancyUpdate(BaseModel):
    status: str
    vacancy_reason: Optional[str] = None
    vacancy_date: Optional[datetime] = None
    expected_available_date: Optional[datetime] = None
    remarks: Optional[str] = None


class PropertyUpdate(BaseModel):
    building: Optional[str] = None
    floor: Optional[str] = None
    room_no: Optional[str] = None
    area: Optional[float] = None
    layout: Optional[str] = None
    decoration: Optional[str] = None
    daily_rent: Optional[float] = None
    monthly_rent: Optional[float] = None
    status: Optional[str] = None
    vacancy_reason: Optional[str] = None
    vacancy_date: Optional[datetime] = None
    expected_available_date: Optional[datetime] = None
    remarks: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: int
    status: str
    vacancy_reason: Optional[str] = None
    vacancy_date: Optional[datetime] = None
    expected_available_date: Optional[datetime] = None
    remarks: Optional[str] = None
    handler_id: Optional[int] = None
    handler_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ViewingBase(BaseModel):
    property_id: int
    customer_name: str
    customer_phone: Optional[str] = None
    viewing_date: datetime
    viewing_duration: Optional[int] = 60
    remarks: Optional[str] = None


class ViewingCreate(ViewingBase):
    inherit_property_remarks: Optional[bool] = False


class ViewingUpdate(BaseModel):
    property_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    viewing_date: Optional[datetime] = None
    viewing_duration: Optional[int] = None
    status: Optional[str] = None
    actual_arrival_time: Optional[datetime] = None
    actual_leave_time: Optional[datetime] = None
    intention_level: Optional[str] = None
    follow_up: Optional[str] = None
    feedback: Optional[str] = None
    remarks: Optional[str] = None


class ViewingResponse(ViewingBase):
    id: int
    status: str
    actual_arrival_time: Optional[datetime] = None
    actual_leave_time: Optional[datetime] = None
    intention_level: Optional[str] = None
    follow_up: Optional[str] = None
    feedback: Optional[str] = None
    handler_id: Optional[int] = None
    handler_name: Optional[str] = None
    property_info: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExceptionBase(BaseModel):
    property_id: Optional[int] = None
    viewing_id: Optional[int] = None
    exception_type: str
    title: str
    description: str
    severity: Optional[str] = "normal"
    remarks: Optional[str] = None


class ExceptionCreate(ExceptionBase):
    pass


class ExceptionUpdate(BaseModel):
    property_id: Optional[int] = None
    viewing_id: Optional[int] = None
    exception_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    solution: Optional[str] = None
    remarks: Optional[str] = None
    severity: Optional[str] = None


class ExceptionResponse(ExceptionBase):
    id: int
    status: str
    solution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    handler_id: Optional[int] = None
    handler_name: Optional[str] = None
    property_info: Optional[dict] = None
    viewing_info: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttachmentBase(BaseModel):
    property_id: Optional[int] = None
    viewing_id: Optional[int] = None
    exception_id: Optional[int] = None
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    storage_type: Optional[str] = "placeholder"
    remarks: Optional[str] = None


class AttachmentCreate(AttachmentBase):
    pass


class AttachmentResponse(AttachmentBase):
    id: int
    file_path: Optional[str] = None
    uploaded_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OperationLogBase(BaseModel):
    target_type: str
    target_id: int
    operation_type: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    remarks: Optional[str] = None


class OperationLogResponse(OperationLogBase):
    id: int
    operator_id: Optional[int] = None
    operator_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PropertyTimelineResponse(BaseModel):
    property_id: int
    property_no: str
    timeline: List[OperationLogResponse]


class HandoverRecordCreate(BaseModel):
    shift_start: datetime
    shift_end: datetime
    outgoing_remarks: Optional[str] = None


class HandoverRecordConfirm(BaseModel):
    remarks: Optional[str] = None


class HandoverRecordResponse(BaseModel):
    id: int
    shift_start: datetime
    shift_end: datetime
    summary_snapshot: str
    vacant_count: int = 0
    pending_viewing_count: int = 0
    pending_exception_count: int = 0
    today_viewing_count: int = 0
    tomorrow_viewing_count: int = 0
    outgoing_user_id: int
    outgoing_user_name: Optional[str] = None
    outgoing_confirmed: bool = False
    outgoing_confirmed_at: Optional[datetime] = None
    incoming_user_id: Optional[int] = None
    incoming_user_name: Optional[str] = None
    incoming_confirmed: bool = False
    incoming_confirmed_at: Optional[datetime] = None
    outgoing_remarks: Optional[str] = None
    incoming_remarks: Optional[str] = None
    status: str = "draft"
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[Union[PropertyResponse, ViewingResponse, ExceptionResponse, AttachmentResponse, OperationLogResponse]]
