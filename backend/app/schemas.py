from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from .models import (
    VehicleStatus, RepairStatus, BatchStatus,
    DeploymentStatus, FeedbackType
)


class RegionBase(BaseModel):
    code: str
    name: str
    manager: Optional[str] = None
    target_capacity: int = 0


class RegionCreate(RegionBase):
    pass


class Region(RegionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RegionSummary(BaseModel):
    id: int
    code: str
    name: str
    target_capacity: int
    available_count: int
    shortage: int

    class Config:
        from_attributes = True


class VehicleBase(BaseModel):
    bike_code: str
    model: Optional[str] = None


class VehicleCreate(VehicleBase):
    current_region_id: Optional[int] = None


class Vehicle(VehicleBase):
    id: int
    status: VehicleStatus
    current_region_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FaultBase(BaseModel):
    fault_type: str
    description: Optional[str] = None
    reporter: Optional[str] = None


class FaultCreate(FaultBase):
    vehicle_id: int
    region_id: Optional[int] = None


class Fault(FaultBase):
    id: int
    vehicle_id: int
    region_id: Optional[int] = None
    reported_at: datetime

    class Config:
        from_attributes = True


class InboundItemCreate(BaseModel):
    vehicle_id: int
    fault_id: Optional[int] = None
    fault_type: Optional[str] = None
    fault_description: Optional[str] = None


class InboundBatchCreate(BaseModel):
    source_region_id: int
    repair_station: str
    operator: Optional[str] = None
    remark: Optional[str] = None
    items: List[InboundItemCreate] = Field(..., min_length=1)


class InboundItem(BaseModel):
    id: int
    vehicle_id: int
    fault_id: Optional[int] = None
    initial_status: VehicleStatus
    vehicle: Optional[Vehicle] = None

    class Config:
        from_attributes = True


class InboundBatch(BaseModel):
    id: int
    batch_code: str
    source_region_id: int
    repair_station: str
    operator: Optional[str] = None
    inbound_at: datetime
    status: BatchStatus
    remark: Optional[str] = None
    items: List[InboundItem] = []

    class Config:
        from_attributes = True


class RepairOrderBase(BaseModel):
    repair_station: str
    mechanic: Optional[str] = None
    parts_needed: Optional[str] = None
    parts_available: bool = True


class RepairReject(BaseModel):
    reject_reason: str = Field(..., min_length=1)
    mechanic: Optional[str] = None


class RepairComplete(BaseModel):
    repair_note: Optional[str] = None
    mechanic: Optional[str] = None


class RepairOrder(BaseModel):
    id: int
    order_code: str
    vehicle_id: int
    fault_id: Optional[int] = None
    repair_station: str
    status: RepairStatus
    mechanic: Optional[str] = None
    parts_needed: Optional[str] = None
    parts_available: bool
    start_time: Optional[datetime] = None
    complete_time: Optional[datetime] = None
    repair_note: Optional[str] = None
    reject_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    vehicle: Optional[Vehicle] = None

    class Config:
        from_attributes = True


class RepairStationSummary(BaseModel):
    repair_station: str
    pending_count: int
    in_progress_count: int
    completed_count: int
    rejected_count: int

    class Config:
        from_attributes = True


class DeploymentItem(BaseModel):
    vehicle_id: int
    repair_order_id: Optional[int] = None


class DeploymentBatchCreate(BaseModel):
    batch_code: Optional[str] = None
    target_region_id: int
    operator: Optional[str] = None
    items: List[DeploymentItem] = Field(..., min_length=1)


class DeploymentRecord(BaseModel):
    id: int
    deployment_code: str
    batch_code: Optional[str] = None
    vehicle_id: int
    target_region_id: int
    repair_order_id: Optional[int] = None
    operator: Optional[str] = None
    deployed_at: datetime
    status: DeploymentStatus
    review_note: Optional[str] = None
    reviewer: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    vehicle: Optional[Vehicle] = None

    class Config:
        from_attributes = True


class DeploymentReview(BaseModel):
    status: DeploymentStatus
    review_note: Optional[str] = None
    reviewer: str = Field(..., min_length=1)


class RegionFeedbackBase(BaseModel):
    feedback_type: FeedbackType
    description: Optional[str] = None
    reporter: Optional[str] = None


class RegionFeedbackCreate(RegionFeedbackBase):
    region_id: int
    deployment_id: int


class RegionFeedback(BaseModel):
    id: int
    region_id: int
    deployment_id: int
    feedback_type: FeedbackType
    description: Optional[str] = None
    reporter: Optional[str] = None
    reported_at: datetime

    class Config:
        from_attributes = True
