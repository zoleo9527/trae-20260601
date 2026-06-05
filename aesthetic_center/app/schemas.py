from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import (
    UserRole, OrderStatus, AnomalyType, AnomalySeverity,
    AnomalyStatus, InspectionResult,
)


class UserBase(BaseModel):
    username: str = Field(..., min_length=2, max_length=64)
    display_name: str = Field(..., min_length=1, max_length=128)
    role: UserRole


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class FlowerMaterialBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    category: str = Field(..., min_length=1, max_length=64)
    unit: str = Field(default="枝", max_length=16)
    is_available: bool = True


class FlowerMaterialCreate(FlowerMaterialBase):
    pass


class FlowerMaterialRead(FlowerMaterialBase):
    id: int

    model_config = {"from_attributes": True}


class OrderItemBase(BaseModel):
    material_id: int
    planned_qty: int = Field(..., gt=0)
    actual_qty: Optional[int] = None
    is_substituted: bool = False
    substituted_with: Optional[str] = None
    substitution_reason: Optional[str] = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemRead(OrderItemBase):
    id: int
    order_id: int

    model_config = {"from_attributes": True}


class OrderItemReadWithMaterial(OrderItemRead):
    material_name: Optional[str] = None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=128)
    customer_phone: str = Field(..., min_length=1, max_length=32)
    delivery_address: str = Field(..., min_length=1, max_length=256)
    greeting_card_text: Optional[str] = None
    promised_delivery_time: datetime
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderSummary(BaseModel):
    latest_inspection_result: Optional[InspectionResult] = None
    open_anomaly_count: int = 0
    highest_anomaly_severity: Optional[AnomalySeverity] = None


class OrderRead(OrderSummary):
    id: int
    order_no: str
    customer_name: str
    customer_phone: str
    delivery_address: str
    greeting_card_text: Optional[str]
    greeting_card_verified: bool
    promised_delivery_time: datetime
    actual_delivery_time: Optional[datetime]
    status: OrderStatus
    created_by: int
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead] = []

    model_config = {"from_attributes": True}


class OrderReadDetail(OrderRead):
    items: list[OrderItemReadWithMaterial] = []
    inspections: list["QualityInspectionRead"] = []
    anomalies: list["AnomalyRecordRead"] = []

    model_config = {"from_attributes": True}


class QualityInspectionCreate(BaseModel):
    order_id: int
    card_text_correct: bool
    flower_freshness_ok: bool
    arrangement_matches_spec: bool
    notes: Optional[str] = None


class QualityInspectionRead(BaseModel):
    id: int
    order_id: int
    inspector_id: int
    card_text_correct: bool
    flower_freshness_ok: bool
    arrangement_matches_spec: bool
    overall_result: InspectionResult
    notes: Optional[str]
    inspected_at: datetime

    model_config = {"from_attributes": True}


class AnomalyRecordCreate(BaseModel):
    order_id: int
    inspection_id: Optional[int] = None
    anomaly_type: AnomalyType
    description: str = Field(..., min_length=1)
    severity: AnomalySeverity = AnomalySeverity.MEDIUM


class AnomalyRecordResolve(BaseModel):
    resolution_note: str = Field(..., min_length=1)


class AnomalyRecordRead(BaseModel):
    id: int
    order_id: int
    inspection_id: Optional[int]
    anomaly_type: AnomalyType
    description: str
    severity: AnomalySeverity
    status: AnomalyStatus
    created_by: int
    created_at: datetime
    resolved_by: Optional[int]
    resolved_at: Optional[datetime]
    resolution_note: Optional[str]

    model_config = {"from_attributes": True}
