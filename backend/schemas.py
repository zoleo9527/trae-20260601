from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    username: str


class UserOut(BaseModel):
    id: int
    username: str
    display_name: str
    role: str

    class Config:
        from_attributes = True


class FruitBatchCreate(BaseModel):
    fruit_type: str
    picking_date: str
    picking_area: str
    quantity_picked: float
    unit: str = "斤"
    guide_name: str


class FruitBatchOut(BaseModel):
    id: int
    batch_no: str
    fruit_type: str
    picking_date: str
    picking_area: str
    quantity_picked: float
    unit: str
    guide_name: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GradingRecordCreate(BaseModel):
    batch_id: int
    grade_a_qty: float = 0
    grade_b_qty: float = 0
    grade_c_qty: float = 0
    grade_d_qty: float = 0
    grading_notes: str = ""


class GradingRecordOut(BaseModel):
    id: int
    batch_id: int
    grade_a_qty: float
    grade_b_qty: float
    grade_c_qty: float
    grade_d_qty: float
    grader_name: str
    grading_notes: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    batch: Optional[FruitBatchOut] = None

    class Config:
        from_attributes = True


class InventoryItemOut(BaseModel):
    id: int
    fruit_type: str
    grade: str
    quantity: float
    unit: str
    warehouse_location: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryChangeLogOut(BaseModel):
    id: int
    inventory_item_id: int
    change_type: str
    quantity_before: float
    quantity_after: float
    change_amount: float
    reason: str
    operator_name: str
    operator_role: str
    related_batch_no: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReservationCreate(BaseModel):
    visitor_name: str
    visitor_phone: str = ""
    reserved_date: str
    fruit_type: str
    reserved_qty: float
    notes: str = ""


class ReservationOut(BaseModel):
    id: int
    visitor_name: str
    visitor_phone: str
    reserved_date: str
    fruit_type: str
    reserved_qty: float
    actual_qty: float
    status: str
    overbook_flag: int
    notes: str
    handler_name: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplaintCreate(BaseModel):
    visitor_name: str
    visitor_phone: str = ""
    content: str
    category: str = "其他"
    related_reservation_id: Optional[int] = None


class ComplaintReply(BaseModel):
    reply_content: str
    handler_name: str


class ComplaintOut(BaseModel):
    id: int
    visitor_name: str
    visitor_phone: str
    content: str
    category: str
    status: str
    handler_name: str
    reply_content: str
    related_reservation_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PickingLossCreate(BaseModel):
    batch_id: int
    expected_qty: float
    actual_qty: float
    loss_reason: str = ""


class PickingLossOut(BaseModel):
    id: int
    batch_id: int
    expected_qty: float
    actual_qty: float
    loss_qty: float
    loss_rate: float
    loss_reason: str
    reporter_name: str
    created_at: Optional[datetime] = None
    batch: Optional[FruitBatchOut] = None

    class Config:
        from_attributes = True


class ProcessingLogOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    operator_name: str
    operator_role: str
    notes: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BatchStatusUpdate(BaseModel):
    status: str
    operator_name: str
    notes: str = ""


class GradingConfirm(BaseModel):
    operator_name: str
    notes: str = ""


class DashboardStats(BaseModel):
    pending_grading: int
    pending_warehousing: int
    pending_complaints: int
    overbooked_reservations: int
    today_batches: int
    total_inventory_value: float
