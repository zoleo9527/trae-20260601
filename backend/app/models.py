from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class RepairOrder(Base):
    __tablename__ = "repair_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String, unique=True, index=True)
    customer_name = Column(String)
    phone = Column(String)
    device_model = Column(String)
    device_serial = Column(String)
    problem_description = Column(Text)
    status = Column(String, default="pending")
    priority = Column(String, default="normal")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    created_by = Column(String)
    assigned_to = Column(String)
    
    spare_parts_issues = relationship("SparePartIssue", back_populates="repair_order")
    repair_records = relationship("RepairRecord", back_populates="repair_order")

class SparePart(Base):
    __tablename__ = "spare_parts"
    
    id = Column(Integer, primary_key=True, index=True)
    part_code = Column(String, unique=True, index=True)
    part_name = Column(String)
    category = Column(String)
    stock = Column(Integer, default=0)
    unit_price = Column(Float)
    supplier = Column(String)
    location = Column(String)
    min_stock = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    issues = relationship("SparePartIssue", back_populates="spare_part")

class SparePartIssue(Base):
    __tablename__ = "spare_part_issues"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"))
    part_id = Column(Integer, ForeignKey("spare_parts.id"))
    quantity = Column(Integer)
    issued_by = Column(String)
    issued_at = Column(DateTime, default=datetime.now)
    returned = Column(Boolean, default=False)
    returned_at = Column(DateTime)
    returned_by = Column(String)
    reason = Column(String)
    
    repair_order = relationship("RepairOrder", back_populates="spare_parts_issues")
    spare_part = relationship("SparePart", back_populates="issues")

class RepairRecord(Base):
    __tablename__ = "repair_records"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"))
    status = Column(String)
    description = Column(Text)
    technician = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    attachments = Column(Text)
    
    repair_order = relationship("RepairOrder", back_populates="repair_records")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String)
    title = Column(String)
    content = Column(Text)
    type = Column(String)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

class ShiftHandOver(Base):
    __tablename__ = "shift_handovers"
    
    id = Column(Integer, primary_key=True, index=True)
    shift = Column(String)
    off_duty_user = Column(String)
    on_duty_user = Column(String)
    summary = Column(Text)
    pending_orders = Column(Integer, default=0)
    completed_orders = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
