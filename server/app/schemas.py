from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from .models import RepairStatus, DispatchStatus, RepairSource, UrgencyLevel, RoleType


class UserCreate(BaseModel):
    username: str = Field(..., max_length=50)
    display_name: str = Field(..., max_length=100)
    role: RoleType
    department: str = Field(..., max_length=50)
    phone: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    role: str
    department: str
    phone: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RepairCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    location: str = Field(..., max_length=200)
    source: RepairSource
    urgency: UrgencyLevel = UrgencyLevel.NORMAL
    activity_occupation: bool = False
    activity_name: Optional[str] = None
    tenant_timeout: bool = False
    complaint_ambiguous: bool = False
    complaint_ref: Optional[str] = None


class StatusLogResponse(BaseModel):
    id: int
    repair_id: Optional[int] = None
    dispatch_id: Optional[int] = None
    from_status: Optional[str] = None
    to_status: str
    operator_id: int
    operator_name: str
    operator_role: str
    remark: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DispatchBriefResponse(BaseModel):
    id: int
    dispatch_no: str
    work_content: str
    work_type: Optional[str] = None
    estimated_hours: float = 4.0
    actual_hours: Optional[float] = None
    status: str
    dispatcher_id: Optional[int] = None
    dispatcher_name: Optional[str] = None
    engineer_id: Optional[int] = None
    engineer_name: Optional[str] = None
    created_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    completion_note: Optional[str] = None
    material_usage: Optional[str] = None

    class Config:
        from_attributes = True


class RepairResponse(BaseModel):
    id: int
    repair_no: str
    title: str
    description: str
    location: str
    source: str
    urgency: str
    activity_occupation: bool
    activity_name: Optional[str] = None
    tenant_timeout: bool
    complaint_ambiguous: bool
    complaint_ref: Optional[str] = None
    status: str
    sla_deadline: datetime
    reporter_id: Optional[int] = None
    handler_id: Optional[int] = None
    created_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    is_overdue: bool = False
    dispatch: Optional[DispatchBriefResponse] = None
    status_logs: list[StatusLogResponse] = []

    class Config:
        from_attributes = True


class RepairListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[RepairResponse]


class RepairAcceptRequest(BaseModel):
    work_content: str = Field(..., description="派单工作内容")
    work_type: Optional[str] = Field(None, description="工种")
    estimated_hours: float = Field(4.0, description="预计工时")
    engineer_id: int = Field(..., description="指派工程师ID")
    remark: Optional[str] = None


class RepairCloseRequest(BaseModel):
    remark: Optional[str] = None


class DispatchCreate(BaseModel):
    repair_id: int
    work_content: str
    work_type: Optional[str] = None
    estimated_hours: float = 4.0
    engineer_id: Optional[int] = None


class DispatchAcceptRequest(BaseModel):
    remark: Optional[str] = None


class DispatchCompleteRequest(BaseModel):
    completion_note: str
    material_usage: Optional[str] = None
    photos: Optional[list[str]] = None
    remark: Optional[str] = None


class DispatchVerifyRequest(BaseModel):
    remark: Optional[str] = None


class RepairBriefForDispatch(BaseModel):
    id: int
    repair_no: str
    title: str
    description: str = ""
    location: str
    urgency: str
    source: str

    class Config:
        from_attributes = True


class DispatchResponse(BaseModel):
    id: int
    dispatch_no: str
    repair_id: int
    work_content: str
    work_type: Optional[str] = None
    estimated_hours: float = 4.0
    actual_hours: Optional[float] = None
    status: str
    sla_deadline: datetime
    dispatcher_id: Optional[int] = None
    dispatcher_name: Optional[str] = None
    engineer_id: Optional[int] = None
    engineer_name: Optional[str] = None
    created_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    completion_note: Optional[str] = None
    material_usage: Optional[str] = None
    photos: Optional[str] = None
    repair: Optional[RepairBriefForDispatch] = None
    status_logs: list[StatusLogResponse] = []

    class Config:
        from_attributes = True


class DispatchListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[DispatchResponse]
    completed_count: int = 0
    avg_actual_hours: Optional[float] = None

    class Config:
        from_attributes = True


class ExportRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
