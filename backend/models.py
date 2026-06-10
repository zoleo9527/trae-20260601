from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)

    logs = relationship("ProcessingLog", back_populates="operator_ref")


class FruitBatch(Base):
    __tablename__ = "fruit_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String(50), unique=True, index=True, nullable=False)
    fruit_type = Column(String(50), nullable=False)
    picking_date = Column(String(20), nullable=False)
    picking_area = Column(String(100), nullable=False)
    quantity_picked = Column(Float, nullable=False)
    unit = Column(String(20), default="斤")
    guide_name = Column(String(100), nullable=False)
    status = Column(String(50), default="picked")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    grading_records = relationship("GradingRecord", back_populates="batch", cascade="all, delete-orphan")
    picking_loss = relationship("PickingLoss", back_populates="batch", uselist=False, cascade="all, delete-orphan")
    logs = relationship("ProcessingLog", back_populates="batch_ref", foreign_keys="ProcessingLog.batch_id")


class GradingRecord(Base):
    __tablename__ = "grading_records"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("fruit_batches.id"), nullable=False)
    grade_a_qty = Column(Float, default=0)
    grade_b_qty = Column(Float, default=0)
    grade_c_qty = Column(Float, default=0)
    grade_d_qty = Column(Float, default=0)
    grader_name = Column(String(100), nullable=False)
    grading_notes = Column(Text, default="")
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    batch = relationship("FruitBatch", back_populates="grading_records")
    logs = relationship("ProcessingLog", back_populates="grading_ref", foreign_keys="ProcessingLog.grading_id")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    fruit_type = Column(String(50), nullable=False)
    grade = Column(String(20), nullable=False)
    quantity = Column(Float, default=0)
    unit = Column(String(20), default="斤")
    warehouse_location = Column(String(100), default="A区冷库")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class InventoryChangeLog(Base):
    __tablename__ = "inventory_change_logs"

    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    change_type = Column(String(50), nullable=False)
    quantity_before = Column(Float, default=0)
    quantity_after = Column(Float, default=0)
    change_amount = Column(Float, default=0)
    reason = Column(Text, default="")
    operator_name = Column(String(100), nullable=False)
    operator_role = Column(String(50), nullable=False)
    related_batch_no = Column(String(50), default="")
    created_at = Column(DateTime, default=datetime.now)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    visitor_name = Column(String(100), nullable=False)
    visitor_phone = Column(String(20), default="")
    reserved_date = Column(String(20), nullable=False)
    fruit_type = Column(String(50), nullable=False)
    reserved_qty = Column(Float, nullable=False)
    actual_qty = Column(Float, default=0)
    status = Column(String(50), default="pending")
    overbook_flag = Column(Integer, default=0)
    notes = Column(Text, default="")
    handler_name = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    visitor_name = Column(String(100), nullable=False)
    visitor_phone = Column(String(20), default="")
    content = Column(Text, nullable=False)
    category = Column(String(50), default="其他")
    status = Column(String(50), default="pending")
    handler_name = Column(String(100), default="")
    reply_content = Column(Text, default="")
    related_reservation_id = Column(Integer, default=None)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    logs = relationship("ProcessingLog", back_populates="complaint_ref", foreign_keys="ProcessingLog.complaint_id")


class PickingLoss(Base):
    __tablename__ = "picking_losses"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("fruit_batches.id"), nullable=False)
    expected_qty = Column(Float, nullable=False)
    actual_qty = Column(Float, nullable=False)
    loss_qty = Column(Float, nullable=False)
    loss_rate = Column(Float, nullable=False)
    loss_reason = Column(Text, default="")
    reporter_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    batch = relationship("FruitBatch", back_populates="picking_loss")


class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(100), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    operator_name = Column(String(100), nullable=False)
    operator_role = Column(String(50), nullable=False)
    notes = Column(Text, default="")
    batch_id = Column(Integer, ForeignKey("fruit_batches.id"), nullable=True)
    grading_id = Column(Integer, ForeignKey("grading_records.id"), nullable=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    operator_ref = relationship("User", back_populates="logs")
    batch_ref = relationship("FruitBatch", back_populates="logs", foreign_keys=[batch_id])
    grading_ref = relationship("GradingRecord", back_populates="logs", foreign_keys=[grading_id])
    complaint_ref = relationship("Complaint", back_populates="logs", foreign_keys=[complaint_id])
