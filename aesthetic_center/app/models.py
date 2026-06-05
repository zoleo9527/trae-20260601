import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Enum, Text, ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    FLORIST = "florist"
    INSPECTOR = "inspector"
    DELIVERY = "delivery"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PRODUCTION = "in_production"
    PRODUCED = "produced"
    INSPECTING = "inspecting"
    PASSED = "passed"
    REWORK = "rework"
    DELIVERING = "delivering"
    DELIVERED = "delivered"


VALID_TRANSITIONS = {
    OrderStatus.PENDING: {OrderStatus.IN_PRODUCTION},
    OrderStatus.IN_PRODUCTION: {OrderStatus.PRODUCED},
    OrderStatus.PRODUCED: {OrderStatus.INSPECTING},
    OrderStatus.INSPECTING: {OrderStatus.PASSED, OrderStatus.REWORK},
    OrderStatus.REWORK: {OrderStatus.IN_PRODUCTION},
    OrderStatus.PASSED: {OrderStatus.DELIVERING},
    OrderStatus.DELIVERING: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED: set(),
}


class AnomalyType(str, enum.Enum):
    MATERIAL_SUBSTITUTION_UNEXPLAINED = "material_substitution_unexplained"
    DELIVERY_TIMEOUT = "delivery_timeout"
    CARD_ERROR = "card_error"
    OTHER = "other"


class AnomalySeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AnomalyStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class InspectionResult(str, enum.Enum):
    PASS = "pass"
    FAIL = "fail"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    display_name = Column(String(128), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    orders_created = relationship("Order", back_populates="creator", foreign_keys="Order.created_by")
    inspections = relationship("QualityInspection", back_populates="inspector")
    anomalies_created = relationship("AnomalyRecord", back_populates="creator", foreign_keys="AnomalyRecord.created_by")
    anomalies_resolved = relationship("AnomalyRecord", back_populates="resolver", foreign_keys="AnomalyRecord.resolved_by")


class FlowerMaterial(Base):
    __tablename__ = "flower_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    unit = Column(String(16), nullable=False, default="枝")
    is_available = Column(Boolean, default=True, nullable=False)

    order_items = relationship("OrderItem", back_populates="material")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(32), unique=True, nullable=False, index=True)
    customer_name = Column(String(128), nullable=False)
    customer_phone = Column(String(32), nullable=False)
    delivery_address = Column(String(256), nullable=False)
    greeting_card_text = Column(Text, nullable=True)
    greeting_card_verified = Column(Boolean, default=False, nullable=False)
    promised_delivery_time = Column(DateTime, nullable=False)
    actual_delivery_time = Column(DateTime, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="orders_created", foreign_keys=[created_by])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    inspections = relationship("QualityInspection", back_populates="order", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyRecord", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("flower_materials.id"), nullable=False)
    planned_qty = Column(Integer, nullable=False)
    actual_qty = Column(Integer, nullable=True)
    is_substituted = Column(Boolean, default=False, nullable=False)
    substituted_with = Column(String(128), nullable=True)
    substitution_reason = Column(Text, nullable=True)

    order = relationship("Order", back_populates="items")
    material = relationship("FlowerMaterial")


class QualityInspection(Base):
    __tablename__ = "quality_inspections"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    card_text_correct = Column(Boolean, nullable=False)
    flower_freshness_ok = Column(Boolean, nullable=False)
    arrangement_matches_spec = Column(Boolean, nullable=False)
    overall_result = Column(Enum(InspectionResult), nullable=False)
    notes = Column(Text, nullable=True)
    inspected_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections")
    anomalies = relationship("AnomalyRecord", back_populates="inspection")


class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    inspection_id = Column(Integer, ForeignKey("quality_inspections.id"), nullable=True)
    anomaly_type = Column(Enum(AnomalyType), nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(Enum(AnomalySeverity), default=AnomalySeverity.MEDIUM, nullable=False)
    status = Column(Enum(AnomalyStatus), default=AnomalyStatus.OPEN, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_note = Column(Text, nullable=True)

    order = relationship("Order", back_populates="anomalies")
    inspection = relationship("QualityInspection", back_populates="anomalies")
    creator = relationship("User", back_populates="anomalies_created", foreign_keys=[created_by])
    resolver = relationship("User", back_populates="anomalies_resolved", foreign_keys=[resolved_by])
