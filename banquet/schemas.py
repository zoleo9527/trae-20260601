from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class EmployeeSchema(BaseModel):
    id: int
    name: str
    role: str
    role_display: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class MenuItemSchema(BaseModel):
    id: int
    name: str
    category: str
    price: float
    description: Optional[str] = None

    class Config:
        from_attributes = True


class MenuConfirmationItemSchema(BaseModel):
    id: int
    menu_item_id: int
    menu_item_name: str
    category: str
    quantity: int
    unit_price: float
    subtotal: float
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class MenuConfirmationSchema(BaseModel):
    id: int
    booking_id: int
    total_amount: float
    special_requirements: Optional[str] = None
    wine_arrangement: Optional[str] = None
    table_layout: Optional[str] = None
    confirmed_by_id: int
    confirmed_by_name: str
    confirmed_at: Optional[datetime] = None
    customer_signed: bool
    customer_signature: Optional[str] = None
    remarks: Optional[str] = None
    items: List[MenuConfirmationItemSchema] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuditLogSchema(BaseModel):
    id: int
    booking_id: int
    action: str
    from_status: Optional[str] = None
    from_status_display: Optional[str] = None
    to_status: Optional[str] = None
    to_status_display: Optional[str] = None
    operator_id: int
    operator_name: str
    operator_role: str
    operator_role_display: str
    timestamp: datetime
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class BookingSchema(BaseModel):
    id: int
    booking_no: str
    customer_name: str
    customer_phone: str
    banquet_type: str
    banquet_date: date
    start_time: time
    end_time: time
    venue: str
    expected_guests: int
    table_count: int
    budget_per_table: float
    status: str
    status_display: str
    sales_person_id: int
    sales_person_name: str
    floor_supervisor_id: Optional[int] = None
    floor_supervisor_name: Optional[str] = None
    kitchen_coordinator_id: Optional[int] = None
    kitchen_coordinator_name: Optional[str] = None
    remarks: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    stuck_level: Optional[str] = None
    stuck_level_display: Optional[str] = None
    stuck_deadline: Optional[datetime] = None
    overdue_hours: Optional[int] = None

    class Config:
        from_attributes = True


class BookingDetailSchema(BookingSchema):
    menu_confirmation: Optional[MenuConfirmationSchema] = None
    audit_logs: List[AuditLogSchema] = []


class BookingCreateSchema(BaseModel):
    customer_name: str
    customer_phone: str
    banquet_type: str
    banquet_date: date
    start_time: time
    end_time: time
    venue: str
    expected_guests: int
    table_count: int
    budget_per_table: float
    sales_person_id: int
    remarks: Optional[str] = None


class BookingUpdateSchema(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    banquet_type: Optional[str] = None
    banquet_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    venue: Optional[str] = None
    expected_guests: Optional[int] = None
    table_count: Optional[int] = None
    budget_per_table: Optional[float] = None
    remarks: Optional[str] = None


class MenuConfirmationItemCreateSchema(BaseModel):
    menu_item_id: int
    quantity: int
    unit_price: float
    remarks: Optional[str] = None


class MenuConfirmSchema(BaseModel):
    items: List[MenuConfirmationItemCreateSchema]
    special_requirements: Optional[str] = None
    wine_arrangement: Optional[str] = None
    table_layout: Optional[str] = None
    customer_signed: bool = False
    customer_signature: Optional[str] = None
    remarks: Optional[str] = None


class StateOperationSchema(BaseModel):
    operator_id: int
    remarks: Optional[str] = None


class StuckBookingSchema(BaseModel):
    booking: BookingSchema
    stuck_level: str
    stuck_level_display: str
    deadline: Optional[datetime] = None
    overdue_hours: int = 0


class ExportRequestSchema(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    include_stuck_only: bool = False
    format: str = Field(default='xlsx', description='导出格式: xlsx 或 csv')
