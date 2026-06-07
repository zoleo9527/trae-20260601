from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.constants import (
    OrderStatus, DeliveryStatus, UserRole, ExportTaskStatus,
    ORDER_STATUS_NAMES, DELIVERY_STATUS_NAMES, ROLE_NAMES, EXPORT_STATUS_NAMES
)


class ApiResponse(BaseModel):
    code: int
    message: str
    data: Optional[Any] = None


class UserBase(BaseModel):
    id: str
    name: str
    role: UserRole
    role_name: str
    phone: Optional[str] = None


class StoreBase(BaseModel):
    id: str
    name: str
    code: str
    address: str
    manager_id: Optional[str] = None
    supervisor_id: Optional[str] = None


class ProductBase(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    unit: str
    price: float


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    sku: str
    quantity: int
    unit_price: float
    confirmed_quantity: Optional[int] = None
    delivered_quantity: Optional[int] = None


class OrderLog(BaseModel):
    id: str
    order_id: str
    action: str
    action_name: str
    operator_id: str
    operator_name: str
    operator_role: UserRole
    operator_role_name: str
    remark: Optional[str] = None
    from_status: Optional[OrderStatus] = None
    to_status: Optional[OrderStatus] = None
    created_at: str


class StoreOrderBase(BaseModel):
    id: str
    order_no: str
    store_id: str
    store_name: str
    store_code: str
    manager_id: str
    manager_name: str
    supervisor_id: Optional[str] = None
    supervisor_name: Optional[str] = None
    product_specialist_id: Optional[str] = None
    product_specialist_name: Optional[str] = None
    status: OrderStatus
    status_name: str
    current_handler: Optional[UserRole] = None
    current_handler_name: Optional[str] = None
    items: List[OrderItem]
    total_amount: float
    total_quantity: int
    delivery_address: str
    expected_delivery_date: Optional[str] = None
    created_at: str
    updated_at: str


class StoreOrderDetail(StoreOrderBase):
    logs: List[OrderLog] = []
    blocked_reason: Optional[str] = None
    allowed_actions: List[str] = []


class DeliveryItem(BaseModel):
    product_id: str
    product_name: str
    sku: str
    quantity: int
    unit_price: float


class DeliveryBase(BaseModel):
    id: str
    delivery_no: str
    order_id: str
    order_no: str
    store_id: str
    store_name: str
    status: DeliveryStatus
    status_name: str
    items: List[DeliveryItem]
    total_quantity: int
    total_amount: float
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    warehouse: Optional[str] = None
    shipped_at: Optional[str] = None
    received_at: Optional[str] = None
    created_at: str
    updated_at: str


class DeliveryDetail(DeliveryBase):
    order: Optional[StoreOrderBase] = None
    logs: List[OrderLog] = []


class ExportTaskBase(BaseModel):
    id: str
    task_name: str
    task_type: str
    status: ExportTaskStatus
    status_name: str
    creator_id: str
    creator_name: str
    file_url: Optional[str] = None
    created_at: str
    updated_at: str


class CreateStoreOrderRequest(BaseModel):
    store_id: str
    items: List[Dict[str, Any]]
    delivery_address: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    operator_id: str


class UpdateStoreOrderRequest(BaseModel):
    items: Optional[List[Dict[str, Any]]] = None
    delivery_address: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    operator_id: str


class OrderActionRequest(BaseModel):
    operator_id: str
    remark: Optional[str] = None
    adjust_items: Optional[List[Dict[str, Any]]] = None


class CreateDeliveryRequest(BaseModel):
    order_id: str
    items: List[Dict[str, Any]]
    warehouse: Optional[str] = None
    operator_id: str


class DeliveryActionRequest(BaseModel):
    operator_id: str
    remark: Optional[str] = None
    warehouse: Optional[str] = None


class CreateExportTaskRequest(BaseModel):
    task_name: str
    task_type: str
    filters: Optional[Dict[str, Any]] = None
    operator_id: str
