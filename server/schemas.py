from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ContainerCreate(BaseModel):
    container_no: str
    size: str
    type: str
    status: str = "待进"
    yard_block: Optional[str] = None
    yard_slot: Optional[str] = None
    vessel: Optional[str] = None
    voyage: Optional[str] = None
    bill_of_lading: Optional[str] = None


class ContainerRead(BaseModel):
    id: int
    container_no: str
    size: str
    type: str
    status: str
    yard_block: Optional[str]
    yard_slot: Optional[str]
    vessel: Optional[str]
    voyage: Optional[str]
    bill_of_lading: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContainerUpdate(BaseModel):
    status: Optional[str] = None
    yard_block: Optional[str] = None
    yard_slot: Optional[str] = None
    vessel: Optional[str] = None
    voyage: Optional[str] = None
    bill_of_lading: Optional[str] = None


class GateReleaseCreate(BaseModel):
    container_id: int
    release_type: str
    truck_company: Optional[str] = None
    truck_plate: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    notes: Optional[str] = None
    operator: Optional[str] = None


class GateReleaseRead(BaseModel):
    id: int
    container_id: int
    release_type: str
    truck_company: Optional[str]
    truck_plate: Optional[str]
    driver_name: Optional[str]
    driver_phone: Optional[str]
    status: str
    notes: Optional[str]
    operator: Optional[str]
    created_at: datetime
    released_at: Optional[datetime]
    container: Optional[ContainerRead] = None

    model_config = {"from_attributes": True}


class GateReleaseDetail(GateReleaseRead):
    timeline_events: list["TimelineEventRead"] = []
    exception_records: list["ExceptionRecordRead"] = []
    attachments: list["AttachmentRead"] = []

    model_config = {"from_attributes": True}


class GateReleaseAction(BaseModel):
    notes: Optional[str] = None
    operator: Optional[str] = None


class FleetAppointmentCreate(BaseModel):
    gate_release_id: Optional[int] = None
    container_id: Optional[int] = None
    truck_company: Optional[str] = None
    truck_plate: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    appointment_time: Optional[str] = None
    appointment_date: Optional[str] = None
    notes: Optional[str] = None
    operator: Optional[str] = None


class FleetAppointmentRead(BaseModel):
    id: int
    gate_release_id: Optional[int]
    container_id: Optional[int]
    truck_company: Optional[str]
    truck_plate: Optional[str]
    driver_name: Optional[str]
    driver_phone: Optional[str]
    appointment_time: Optional[str]
    appointment_date: Optional[str]
    status: str
    notes: Optional[str]
    operator: Optional[str]
    created_at: datetime
    confirmed_at: Optional[datetime]
    completed_at: Optional[datetime]
    container: Optional[ContainerRead] = None
    gate_release: Optional[GateReleaseRead] = None

    model_config = {"from_attributes": True}


class FleetAppointmentDetail(FleetAppointmentRead):
    timeline_events: list["TimelineEventRead"] = []
    exception_records: list["ExceptionRecordRead"] = []
    attachments: list["AttachmentRead"] = []

    model_config = {"from_attributes": True}


class FleetAppointmentAction(BaseModel):
    notes: Optional[str] = None
    operator: Optional[str] = None


class FleetAppointmentException(BaseModel):
    exception_type: str
    description: Optional[str] = None
    operator: Optional[str] = None


class TimelineEventCreate(BaseModel):
    entity_type: str
    entity_id: int
    event_type: str
    description: Optional[str] = None
    operator: Optional[str] = None


class TimelineEventRead(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    event_type: str
    description: Optional[str]
    operator: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ExceptionRecordCreate(BaseModel):
    entity_type: str
    entity_id: int
    exception_type: str
    description: Optional[str] = None
    handler: Optional[str] = None


class ExceptionRecordRead(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    exception_type: str
    description: Optional[str]
    status: str
    handler: Optional[str]
    handled_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class ExceptionHandle(BaseModel):
    handler: str
    result: Optional[str] = None


class AttachmentCreate(BaseModel):
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by: Optional[str] = None


class AttachmentRead(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    file_name: str
    file_type: Optional[str]
    file_size: Optional[int]
    uploaded_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


GateReleaseDetail.model_rebuild()
FleetAppointmentDetail.model_rebuild()
