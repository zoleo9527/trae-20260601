from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class RepairStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DISPATCHED = "dispatched"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLOSED = "closed"


class DispatchStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    VERIFIED = "verified"


class RepairSource(str, Enum):
    OPERATION = "operation"
    SERVICE_DESK = "service_desk"
    TENANT = "tenant"


class UrgencyLevel(str, Enum):
    NORMAL = "normal"
    URGENT = "urgent"
    EMERGENCY = "emergency"


class RoleType(str, Enum):
    OPERATION = "operation"
    SERVICE_DESK = "service_desk"
    ENGINEERING = "engineering"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)
    department = Column(String(50), nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class PublicRepair(Base):
    __tablename__ = "public_repairs"
    id = Column(Integer, primary_key=True, index=True)
    repair_no = Column(String(32), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(200), nullable=False)
    source = Column(String(20), nullable=False)
    urgency = Column(String(20), default="normal")

    activity_occupation = Column(Boolean, default=False)
    activity_name = Column(String(200))
    tenant_timeout = Column(Boolean, default=False)
    complaint_ambiguous = Column(Boolean, default=False)
    complaint_ref = Column(String(32))

    status = Column(String(20), default="pending", index=True)
    sla_deadline = Column(DateTime, nullable=False)

    reporter_id = Column(Integer, ForeignKey("users.id"))
    handler_id = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime, server_default=func.now())
    accepted_at = Column(DateTime)
    dispatched_at = Column(DateTime)
    completed_at = Column(DateTime)
    closed_at = Column(DateTime)

    dispatch = relationship("EngineeringDispatch", back_populates="repair", uselist=False, cascade="all, delete-orphan")
    status_logs = relationship("StatusLog", back_populates="repair", cascade="all, delete-orphan", foreign_keys="StatusLog.repair_id")


class EngineeringDispatch(Base):
    __tablename__ = "engineering_dispatches"
    id = Column(Integer, primary_key=True, index=True)
    dispatch_no = Column(String(32), unique=True, index=True, nullable=False)
    repair_id = Column(Integer, ForeignKey("public_repairs.id"), unique=True, nullable=False)

    work_content = Column(Text, nullable=False)
    work_type = Column(String(50))
    estimated_hours = Column(Float, default=4.0)

    status = Column(String(20), default="pending", index=True)
    sla_deadline = Column(DateTime, nullable=False)

    dispatcher_id = Column(Integer, ForeignKey("users.id"))
    engineer_id = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime, server_default=func.now())
    accepted_at = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    verified_at = Column(DateTime)

    completion_note = Column(Text)
    material_usage = Column(Text)
    photos = Column(Text)

    repair = relationship("PublicRepair", back_populates="dispatch")
    status_logs = relationship("StatusLog", back_populates="dispatch", cascade="all, delete-orphan", foreign_keys="StatusLog.dispatch_id")


class StatusLog(Base):
    __tablename__ = "status_logs"
    id = Column(Integer, primary_key=True, index=True)
    repair_id = Column(Integer, ForeignKey("public_repairs.id"), nullable=True)
    dispatch_id = Column(Integer, ForeignKey("engineering_dispatches.id"), nullable=True)

    from_status = Column(String(20))
    to_status = Column(String(20), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    operator_name = Column(String(100), nullable=False)
    operator_role = Column(String(20), nullable=False)
    remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    repair = relationship("PublicRepair", back_populates="status_logs", foreign_keys=[repair_id])
    dispatch = relationship("EngineeringDispatch", back_populates="status_logs", foreign_keys=[dispatch_id])
