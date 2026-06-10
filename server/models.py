from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    arrived = "arrived"


class ArrivalStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    exception = "exception"


class AttachmentEntityType(str, Enum):
    order = "order"
    arrival = "arrival"


class AttachmentStatus(str, Enum):
    placeholder = "placeholder"
    uploaded = "uploaded"


class LogEntityType(str, Enum):
    order = "order"
    arrival = "arrival"
    attachment = "attachment"


class LogAction(str, Enum):
    create = "create"
    update = "update"
    status_change = "status_change"
    confirm = "confirm"
    delete = "delete"
    attach = "attach"


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = ""
    product_name: str
    product_spec: Optional[str] = ""
    quantity: float
    unit: Optional[str] = "kg"
    unit_price: Optional[float] = 0
    note: Optional[str] = ""


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    product_name: Optional[str] = None
    product_spec: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    note: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class AttachmentResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    file_name: str
    note: str
    status: str
    created_at: str


class OrderResponse(BaseModel):
    id: int
    order_no: str
    customer_name: str
    customer_phone: str
    product_name: str
    product_spec: str
    quantity: float
    unit: str
    unit_price: float
    total_amount: float
    note: str
    status: str
    created_at: str
    updated_at: str
    attachments: list[AttachmentResponse] = []


class ArrivalCreate(BaseModel):
    order_id: int
    arrival_note: Optional[str] = ""
    actual_quantity: Optional[float] = None
    exception_note: Optional[str] = ""


class ArrivalConfirm(BaseModel):
    actual_quantity: float
    exception_note: Optional[str] = ""


class ArrivalResponse(BaseModel):
    id: int
    arrival_no: str
    order_id: int
    order_no: str
    product_name: str
    product_spec: str
    order_note: str
    ordered_quantity: float
    actual_quantity: Optional[float] = None
    unit: str
    arrival_note: str
    exception_note: str
    status: str
    created_at: str
    updated_at: str
    attachments: list[AttachmentResponse] = []


class AttachmentCreate(BaseModel):
    entity_type: AttachmentEntityType
    entity_id: int
    file_name: str
    note: Optional[str] = ""


class AttachmentUpdate(BaseModel):
    status: AttachmentStatus


class OperationLogResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    detail: str
    operator: str
    created_at: str


class NotificationType(str, Enum):
    arrival_reminder = "arrival_reminder"
    exception_alert = "exception_alert"


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    content: str
    order_id: int | None = None
    order_no: str
    arrival_id: int | None = None
    arrival_no: str
    is_read: bool
    created_at: str
