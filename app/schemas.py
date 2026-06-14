from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models import UserRole, MaterialStatus, FeedbackStatus, AlertType, AlertLevel


class UserBase(BaseModel):
    username: str
    real_name: str
    role: UserRole
    store_id: Optional[int] = None
    area_id: Optional[int] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AreaBase(BaseModel):
    name: str
    description: Optional[str] = None


class AreaCreate(AreaBase):
    pass


class Area(AreaBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StoreBase(BaseModel):
    name: str
    code: str
    area_id: int
    address: Optional[str] = None
    contact_phone: Optional[str] = None


class StoreCreate(StoreBase):
    pass


class Store(StoreBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ActivityMaterialBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    quantity: int = 1
    store_id: int
    expected_complete_date: Optional[datetime] = None


class ActivityMaterialCreate(ActivityMaterialBase):
    pass


class ActivityMaterialUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = None
    expected_complete_date: Optional[datetime] = None


class ActivityMaterial(ActivityMaterialBase):
    id: int
    status: MaterialStatus
    distributed_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    actual_complete_date: Optional[datetime] = None
    current_handler_id: Optional[int] = None
    stuck_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StoreFeedbackBase(BaseModel):
    material_id: int
    store_id: int
    title: str
    content: str
    feedback_type: Optional[str] = None
    priority: int = 1


class StoreFeedbackCreate(StoreFeedbackBase):
    pass


class StoreFeedbackUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    feedback_type: Optional[str] = None
    priority: Optional[int] = None


class StoreFeedback(StoreFeedbackBase):
    id: int
    status: FeedbackStatus
    current_handler_id: Optional[int] = None
    resolution: Optional[str] = None
    rejected_reason: Optional[str] = None
    stuck_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProcessingRecordBase(BaseModel):
    material_id: Optional[int] = None
    feedback_id: Optional[int] = None
    from_status: Optional[str] = None
    to_status: str
    action: str
    notes: Optional[str] = None


class ProcessingRecordCreate(ProcessingRecordBase):
    pass


class ProcessingRecord(ProcessingRecordBase):
    id: int
    handler_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AlertBase(BaseModel):
    alert_type: AlertType
    alert_level: AlertLevel = AlertLevel.WARNING
    title: str
    message: str
    material_id: Optional[int] = None
    feedback_id: Optional[int] = None


class AlertCreate(AlertBase):
    pass


class Alert(AlertBase):
    id: int
    is_handled: bool
    handled_by_id: Optional[int] = None
    handled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExportTaskBase(BaseModel):
    task_type: str
    parameters: Optional[str] = None


class ExportTaskCreate(ExportTaskBase):
    pass


class ExportTask(ExportTaskBase):
    id: int
    status: str
    file_path: Optional[str] = None
    created_by_id: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class StatusChangeRequest(BaseModel):
    to_status: str
    notes: Optional[str] = None
    handler_id: int


class StuckMaterialResponse(BaseModel):
    material_id: int
    material_name: str
    material_code: str
    store_name: str
    current_status: MaterialStatus
    current_handler: Optional[str]
    stuck_reason: Optional[str]
    days_stuck: int
    processing_history: List[ProcessingRecord]


class StuckFeedbackResponse(BaseModel):
    feedback_id: int
    feedback_title: str
    material_name: str
    store_name: str
    current_status: FeedbackStatus
    current_handler: Optional[str]
    stuck_reason: Optional[str]
    days_stuck: int
    processing_history: List[ProcessingRecord]


class ResponsibilityChainResponse(BaseModel):
    material_id: Optional[int]
    feedback_id: Optional[int]
    item_type: str
    item_name: str
    current_handler: Optional[User]
    handler_role: Optional[str]
    current_status: str
    stuck_at: Optional[str]
    reason_not_completed: Optional[str]
    escalation_path: List[dict]
    latest_processing_note: Optional[dict]