from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    CLERK = "clerk"
    STORE_MANAGER = "store_manager"
    AREA_ADMIN = "area_admin"


class MaterialStatus(str, enum.Enum):
    PENDING = "pending"
    DISTRIBUTED = "distributed"
    RECEIVED = "received"
    IN_USE = "in_use"
    COMPLETED = "completed"
    STUCK = "stuck"


class FeedbackStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    ESCALATED = "escalated"


class AlertType(str, enum.Enum):
    TIMEOUT = "timeout"
    STUCK = "stuck"
    UNCLEAR_RESPONSIBILITY = "unclear_responsibility"
    ESCALATION_NEEDED = "escalation_needed"


class AlertLevel(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    real_name = Column(String(50), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=True)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="users")
    area = relationship("Area", back_populates="users")
    processing_records = relationship("ProcessingRecord", back_populates="handler")


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    stores = relationship("Store", back_populates="area")
    users = relationship("User", back_populates="area")


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    address = Column(String(255))
    contact_phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    area = relationship("Area", back_populates="stores")
    users = relationship("User", back_populates="store")
    materials = relationship("ActivityMaterial", back_populates="store")
    feedbacks = relationship("StoreFeedback", back_populates="store")


class ActivityMaterial(Base):
    __tablename__ = "activity_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    quantity = Column(Integer, default=1)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    status = Column(Enum(MaterialStatus), default=MaterialStatus.PENDING)
    distributed_at = Column(DateTime(timezone=True))
    received_at = Column(DateTime(timezone=True))
    expected_complete_date = Column(DateTime(timezone=True))
    actual_complete_date = Column(DateTime(timezone=True))
    current_handler_id = Column(Integer, ForeignKey("users.id"))
    stuck_reason = Column(Text)
    status_changed_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="materials")
    current_handler = relationship("User")
    processing_records = relationship(
        "ProcessingRecord",
        back_populates="material",
        foreign_keys="ProcessingRecord.material_id",
    )
    feedbacks = relationship("StoreFeedback", back_populates="material")


class StoreFeedback(Base):
    __tablename__ = "store_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("activity_materials.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    feedback_type = Column(String(50))
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.PENDING)
    priority = Column(Integer, default=1)
    current_handler_id = Column(Integer, ForeignKey("users.id"))
    resolution = Column(Text)
    rejected_reason = Column(Text)
    stuck_reason = Column(Text)
    status_changed_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True))

    material = relationship("ActivityMaterial", back_populates="feedbacks")
    store = relationship("Store", back_populates="feedbacks")
    current_handler = relationship("User")
    processing_records = relationship(
        "ProcessingRecord",
        back_populates="feedback",
        foreign_keys="ProcessingRecord.feedback_id",
    )


class ProcessingRecord(Base):
    __tablename__ = "processing_records"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("activity_materials.id"), nullable=True)
    feedback_id = Column(Integer, ForeignKey("store_feedbacks.id"), nullable=True)
    handler_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    from_status = Column(String(50))
    to_status = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship(
        "ActivityMaterial", back_populates="processing_records", foreign_keys=[material_id]
    )
    feedback = relationship(
        "StoreFeedback", back_populates="processing_records", foreign_keys=[feedback_id]
    )
    handler = relationship("User", back_populates="processing_records")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(Enum(AlertType), nullable=False)
    alert_level = Column(Enum(AlertLevel), default=AlertLevel.WARNING)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    material_id = Column(Integer, ForeignKey("activity_materials.id"), nullable=True)
    feedback_id = Column(Integer, ForeignKey("store_feedbacks.id"), nullable=True)
    is_handled = Column(Boolean, default=False)
    handled_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    handled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("ActivityMaterial")
    feedback = relationship("StoreFeedback")
    handled_by = relationship("User")


class ExportTask(Base):
    __tablename__ = "export_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String(50), nullable=False)
    parameters = Column(Text)
    status = Column(String(20), default="pending")
    file_path = Column(String(255))
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)

    created_by = relationship("User")