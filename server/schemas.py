from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CargoOrderCreate(BaseModel):
    flight_no: str
    arrival_time: datetime
    goods_name: str
    goods_type: str
    weight_kg: float
    consignee: str
    contact_phone: str


class CargoOrderUpdate(BaseModel):
    status: Optional[str] = None
    is_urgent: Optional[bool] = None


class CargoOrderOut(BaseModel):
    id: int
    order_no: str
    flight_no: str
    arrival_time: datetime
    goods_name: str
    goods_type: str
    weight_kg: float
    consignee: str
    contact_phone: str
    status: str
    is_urgent: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LocationAllocationCreate(BaseModel):
    order_id: int
    zone: str
    shelf: str
    position: str
    allocated_by: str
    notes: str = ""


class LocationAllocationUpdate(BaseModel):
    zone: Optional[str] = None
    shelf: Optional[str] = None
    position: Optional[str] = None
    allocated_by: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class LocationAllocationOut(BaseModel):
    id: int
    order_id: int
    zone: str
    shelf: str
    position: str
    full_location: str
    allocated_by: str
    allocated_at: datetime
    status: str
    notes: str
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PickupAppointmentCreate(BaseModel):
    order_id: int
    appointee: str
    contact_phone: str
    appointment_time: Optional[datetime] = None
    notes: str = ""


class PickupAppointmentUpdate(BaseModel):
    appointment_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PickupAppointmentOut(BaseModel):
    id: int
    order_id: int
    allocation_id: Optional[int] = None
    appointee: str
    contact_phone: str
    appointment_time: Optional[datetime] = None
    status: str
    notes: str
    allocation_snapshot: str
    allocation_changed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StatusChangeLogCreate(BaseModel):
    entity_type: str
    entity_id: int
    from_status: Optional[str] = None
    to_status: str
    changed_by: str
    role: str
    notes: str = ""


class StatusChangeLogOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    from_status: Optional[str] = None
    to_status: str
    changed_by: str
    role: str
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True


class StatusTransition(BaseModel):
    order_id: int
    to_status: str
    changed_by: str
    role: str
    notes: str = ""


class AllocationAction(BaseModel):
    allocation_id: int
    action: str
    changed_by: str
    zone: Optional[str] = None
    shelf: Optional[str] = None
    position: Optional[str] = None
    notes: str = ""


class AppointmentAction(BaseModel):
    appointment_id: int
    action: str
    changed_by: str
    appointment_time: Optional[datetime] = None
    notes: str = ""


class TimelineEntry(BaseModel):
    entity_type: str
    entity_id: int
    action_label: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    changed_by: str
    role: str
    notes: str = ""
    created_at: datetime


class TimelineResponse(BaseModel):
    order: CargoOrderOut
    allocation: Optional[LocationAllocationOut] = None
    appointments: list[PickupAppointmentOut] = []
    entries: list[TimelineEntry] = []
