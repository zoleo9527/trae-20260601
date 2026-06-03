from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    STORE_CLERK = "store_clerk"
    EQUIPMENT_ADMIN = "equipment_admin"
    FINANCE = "finance"

class RentalStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DEPOSIT_FROZEN = "deposit_frozen"
    PICKED_UP = "picked_up"
    RETURNED = "returned"
    DEPOSIT_REFUNDED = "deposit_refunded"
    DEPOSIT_DEDUCTED = "deposit_deducted"
    CANCELLED = "cancelled"

class EquipmentStatus(str, enum.Enum):
    AVAILABLE = "available"
    RENTED = "rented"
    MAINTENANCE = "maintenance"
    DAMAGED = "damaged"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    name = Column(String(100))
    role = Column(Enum(UserRole))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    category = Column(String(100))
    model = Column(String(100))
    serial_number = Column(String(100), unique=True)
    daily_rate = Column(Float)
    deposit_amount = Column(Float)
    status = Column(Enum(EquipmentStatus), default=EquipmentStatus.AVAILABLE)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RentalRecord(Base):
    __tablename__ = "rental_records"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    customer_id_card = Column(String(50))
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    actual_return_date = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(Enum(RentalStatus), default=RentalStatus.PENDING)
    
    deposit_amount = Column(Float)
    deposit_frozen_at = Column(DateTime(timezone=True), nullable=True)
    deposit_frozen_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    deposit_refunded_at = Column(DateTime(timezone=True), nullable=True)
    deposit_refunded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    deposit_refund_reason = Column(Text, nullable=True)
    
    total_amount = Column(Float, default=0)
    
    created_by = Column(Integer, ForeignKey("users.id"))
    confirmed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    picked_up_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    returned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    return_remark = Column(Text, nullable=True)
    supplement_note = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    equipment = relationship("Equipment")
    creator = relationship("User", foreign_keys=[created_by])
    confirmer = relationship("User", foreign_keys=[confirmed_by])

class StatusHistory(Base):
    __tablename__ = "status_history"
    
    id = Column(Integer, primary_key=True, index=True)
    rental_record_id = Column(Integer, ForeignKey("rental_records.id"))
    from_status = Column(Enum(RentalStatus), nullable=True)
    to_status = Column(Enum(RentalStatus))
    changed_by = Column(Integer, ForeignKey("users.id"))
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    changer = relationship("User")

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    rental_record_id = Column(Integer, ForeignKey("rental_records.id"), nullable=True)
    description = Column(Text)
    repair_cost = Column(Float, default=0)
    handled_by = Column(Integer, ForeignKey("users.id"))
    is_damage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    equipment = relationship("Equipment")
    handler = relationship("User")

class TodoItem(Base):
    __tablename__ = "todo_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    rental_record_id = Column(Integer, ForeignKey("rental_records.id"))
    title = Column(String(200))
    description = Column(Text, nullable=True)
    is_completed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User")
    rental_record = relationship("RentalRecord")
