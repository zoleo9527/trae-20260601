import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float, Text, Boolean
from sqlalchemy.orm import relationship

from .database import Base


class VehicleStatus(str, enum.Enum):
    IN_SERVICE = "IN_SERVICE"
    BROKEN = "BROKEN"
    IN_REPAIR = "IN_REPAIR"
    REPAIRED = "REPAIRED"
    DEPLOYED = "DEPLOYED"
    SCRAPPED = "SCRAPPED"


class RepairStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"


class BatchStatus(str, enum.Enum):
    CREATED = "CREATED"
    COMPLETED = "COMPLETED"


class DeploymentStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    CONFIRMED = "CONFIRMED"
    ISSUE_FOUND = "ISSUE_FOUND"


class FeedbackType(str, enum.Enum):
    CONFIRM = "CONFIRM"
    ISSUE = "ISSUE"


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    manager = Column(String(100))
    target_capacity = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicles = relationship("Vehicle", back_populates="current_region")
    feedbacks = relationship("RegionFeedback", back_populates="region")
    source_batches = relationship("InboundBatch", foreign_keys="InboundBatch.source_region_id", back_populates="source_region")
    target_deployments = relationship("DeploymentRecord", back_populates="target_region")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    bike_code = Column(String(50), unique=True, index=True, nullable=False)
    model = Column(String(50))
    status = Column(Enum(VehicleStatus), default=VehicleStatus.IN_SERVICE, nullable=False)
    current_region_id = Column(Integer, ForeignKey("regions.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    current_region = relationship("Region", back_populates="vehicles")
    faults = relationship("Fault", back_populates="vehicle")
    repair_orders = relationship("RepairOrder", back_populates="vehicle")
    inbound_items = relationship("InboundItem", back_populates="vehicle")
    deployments = relationship("DeploymentRecord", back_populates="vehicle")


class Fault(Base):
    __tablename__ = "faults"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    fault_type = Column(String(100), nullable=False)
    description = Column(Text)
    reporter = Column(String(100))
    reported_at = Column(DateTime, default=datetime.utcnow)
    region_id = Column(Integer, ForeignKey("regions.id"))

    vehicle = relationship("Vehicle", back_populates="faults")
    repair_orders = relationship("RepairOrder", back_populates="fault")
    inbound_items = relationship("InboundItem", back_populates="fault")


class InboundBatch(Base):
    __tablename__ = "inbound_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_code = Column(String(50), unique=True, index=True, nullable=False)
    source_region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    repair_station = Column(String(100), nullable=False)
    operator = Column(String(100))
    inbound_at = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(BatchStatus), default=BatchStatus.CREATED, nullable=False)
    remark = Column(Text)

    source_region = relationship("Region", back_populates="source_batches")
    items = relationship("InboundItem", back_populates="batch", cascade="all, delete-orphan")


class InboundItem(Base):
    __tablename__ = "inbound_items"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("inbound_batches.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    fault_id = Column(Integer, ForeignKey("faults.id"))
    initial_status = Column(Enum(VehicleStatus), default=VehicleStatus.BROKEN)

    batch = relationship("InboundBatch", back_populates="items")
    vehicle = relationship("Vehicle", back_populates="inbound_items")
    fault = relationship("Fault", back_populates="inbound_items")
    repair_order = relationship("RepairOrder", back_populates="inbound_item", uselist=False)


class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    fault_id = Column(Integer, ForeignKey("faults.id"))
    inbound_item_id = Column(Integer, ForeignKey("inbound_items.id"))
    repair_station = Column(String(100), nullable=False)
    status = Column(Enum(RepairStatus), default=RepairStatus.PENDING, nullable=False)
    mechanic = Column(String(100))
    parts_needed = Column(Text)
    parts_available = Column(Boolean, default=True)
    start_time = Column(DateTime)
    complete_time = Column(DateTime)
    repair_note = Column(Text)
    reject_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="repair_orders")
    fault = relationship("Fault", back_populates="repair_orders")
    inbound_item = relationship("InboundItem", back_populates="repair_order")


class DeploymentRecord(Base):
    __tablename__ = "deployment_records"

    id = Column(Integer, primary_key=True, index=True)
    deployment_code = Column(String(50), unique=True, index=True, nullable=False)
    batch_code = Column(String(50), index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    target_region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    repair_order_id = Column(Integer, ForeignKey("repair_orders.id"))
    operator = Column(String(100))
    deployed_at = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(DeploymentStatus), default=DeploymentStatus.PENDING_REVIEW, nullable=False)
    review_note = Column(Text)
    reviewer = Column(String(100))
    reviewed_at = Column(DateTime)

    vehicle = relationship("Vehicle", back_populates="deployments")
    target_region = relationship("Region", back_populates="target_deployments")
    repair_order = relationship("RepairOrder")
    feedbacks = relationship("RegionFeedback", back_populates="deployment")


class RegionFeedback(Base):
    __tablename__ = "region_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    deployment_id = Column(Integer, ForeignKey("deployment_records.id"), nullable=False)
    feedback_type = Column(Enum(FeedbackType), nullable=False)
    description = Column(Text)
    reporter = Column(String(100))
    reported_at = Column(DateTime, default=datetime.utcnow)

    region = relationship("Region", back_populates="feedbacks")
    deployment = relationship("DeploymentRecord", back_populates="feedbacks")
