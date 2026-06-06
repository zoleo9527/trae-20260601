from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

from .models import WorkOrderStatus, Role


class WorkOrderBase(BaseModel):
    vehicle_plate: str = Field(..., description='车牌号')
    driver_name: str = Field(..., description='司机姓名')
    driver_phone: str = Field(..., description='司机电话')
    dock_number: str = Field(..., description='月台号')
    cargo_type: str = Field(..., description='货物类型')
    cargo_weight: Optional[float] = Field(None, description='货物重量(吨)')
    supplementary_notes: Optional[str] = Field(None, description='补充备注')


class WorkOrderCreate(WorkOrderBase):
    idempotency_key: str = Field(..., description='幂等键')


class WorkOrderDispatch(BaseModel):
    forklift_number: str = Field(..., description='叉车编号')
    operator_name: str = Field(..., description='叉车司机')
    dispatcher: str = Field(..., description='调度员')
    supplementary_notes: Optional[str] = Field(None, description='补充备注')


class WorkOrderStartWork(BaseModel):
    supplementary_notes: Optional[str] = Field(None, description='补充备注')


class WorkOrderEndWork(BaseModel):
    warehouse_clerk: str = Field(..., description='仓库文员')
    supplementary_notes: Optional[str] = Field(None, description='补充备注')


class WorkOrderConfirm(BaseModel):
    supplementary_notes: Optional[str] = Field(None, description='补充备注')


class WorkOrderReturn(BaseModel):
    return_reason: str = Field(..., description='退回原因')
    operator_name: str = Field(..., description='操作人')
    supplementary_notes: Optional[str] = Field(None, description='补充备注')


class WorkOrderException(BaseModel):
    exception_note: str = Field(..., description='异常说明')
    operator_name: str = Field(..., description='操作人')
    supplementary_notes: Optional[str] = Field(None, description='补充备注')


class StatusHistoryOut(BaseModel):
    id: UUID
    from_status: Optional[WorkOrderStatus]
    to_status: WorkOrderStatus
    operator_role: Role
    operator_name: str
    remark: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class WorkOrderOut(BaseModel):
    id: UUID
    idempotency_key: str
    vehicle_plate: str
    driver_name: str
    driver_phone: str
    dock_number: str
    cargo_type: str
    cargo_weight: Optional[float]
    status: WorkOrderStatus
    current_role: Optional[Role]
    forklift_number: Optional[str]
    operator_name: Optional[str]
    dispatched_at: Optional[datetime]
    work_start_at: Optional[datetime]
    work_end_at: Optional[datetime]
    work_duration_minutes: Optional[int]
    return_reason: Optional[str]
    supplementary_notes: Optional[str]
    exception_note: Optional[str]
    dispatcher: Optional[str]
    warehouse_clerk: Optional[str]
    created_at: datetime
    updated_at: datetime
    status_history: List[StatusHistoryOut] = []

    class Config:
        from_attributes = True


class WorkOrderListOut(BaseModel):
    id: UUID
    vehicle_plate: str
    driver_name: str
    dock_number: str
    cargo_type: str
    status: WorkOrderStatus
    current_role: Optional[Role]
    forklift_number: Optional[str]
    operator_name: Optional[str]
    dispatched_at: Optional[datetime]
    work_start_at: Optional[datetime]
    work_end_at: Optional[datetime]
    work_duration_minutes: Optional[int]
    return_reason: Optional[str]
    exception_note: Optional[str]
    supplementary_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TodoItemOut(BaseModel):
    role: Role
    role_name: str
    pending_count: int
    items: List[WorkOrderListOut]


class DashboardStats(BaseModel):
    total: int
    pending_dispatch: int
    in_progress: int
    pending_confirm: int
    completed_today: int
    exception_count: int
