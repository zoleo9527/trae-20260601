from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    real_name = Column(String(50), nullable=False)
    role = Column(String(20), default="staff")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    properties = relationship("Property", back_populates="handler")
    viewings = relationship("Viewing", back_populates="handler")
    exceptions = relationship("ExceptionRecord", back_populates="handler")
    operations = relationship("OperationLog", back_populates="operator")


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    property_no = Column(String(50), unique=True, index=True, nullable=False)
    building = Column(String(100), nullable=False)
    floor = Column(String(20), nullable=False)
    room_no = Column(String(50), nullable=False)
    area = Column(Float, nullable=False)
    layout = Column(String(50))
    decoration = Column(String(50))
    daily_rent = Column(Float)
    monthly_rent = Column(Float)
    status = Column(String(20), default="vacant")
    vacancy_reason = Column(Text)
    vacancy_date = Column(DateTime(timezone=True))
    expected_available_date = Column(DateTime(timezone=True))
    remarks = Column(Text)
    handler_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    handler = relationship("User", back_populates="properties")
    viewings = relationship("Viewing", back_populates="property")
    exceptions = relationship("ExceptionRecord", back_populates="property")
    attachments = relationship("Attachment", back_populates="property")
    operations = relationship("OperationLog", primaryjoin="and_(OperationLog.target_type=='property', foreign(OperationLog.target_id)==Property.id)", overlaps="operations,operations")


class Viewing(Base):
    __tablename__ = "viewings"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20))
    viewing_date = Column(DateTime(timezone=True), nullable=False)
    viewing_duration = Column(Integer)
    status = Column(String(20), default="scheduled")
    actual_arrival_time = Column(DateTime(timezone=True))
    actual_leave_time = Column(DateTime(timezone=True))
    intention_level = Column(String(20))
    follow_up = Column(Text)
    feedback = Column(Text)
    remarks = Column(Text)
    handler_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    property = relationship("Property", back_populates="viewings")
    handler = relationship("User", back_populates="viewings")
    exceptions = relationship("ExceptionRecord", back_populates="viewing")
    attachments = relationship("Attachment", back_populates="viewing")
    operations = relationship("OperationLog", primaryjoin="and_(OperationLog.target_type=='viewing', foreign(OperationLog.target_id)==Viewing.id)", overlaps="operations")


class ExceptionRecord(Base):
    __tablename__ = "exceptions"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    viewing_id = Column(Integer, ForeignKey("viewings.id"))
    exception_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="normal")
    status = Column(String(20), default="pending")
    solution = Column(Text)
    resolved_at = Column(DateTime(timezone=True))
    remarks = Column(Text)
    handler_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    property = relationship("Property", back_populates="exceptions")
    viewing = relationship("Viewing", back_populates="exceptions")
    handler = relationship("User", back_populates="exceptions")
    attachments = relationship("Attachment", back_populates="exception")
    operations = relationship("OperationLog", primaryjoin="and_(OperationLog.target_type=='exception', foreign(OperationLog.target_id)==ExceptionRecord.id)", overlaps="operations,operations")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    viewing_id = Column(Integer, ForeignKey("viewings.id"))
    exception_id = Column(Integer, ForeignKey("exceptions.id"))
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    file_path = Column(String(500))
    storage_type = Column(String(20), default="placeholder")
    uploaded_by = Column(String(50))
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property", back_populates="attachments")
    viewing = relationship("Viewing", back_populates="attachments")
    exception = relationship("ExceptionRecord", back_populates="attachments")


class HandoverRecord(Base):
    __tablename__ = "handover_records"

    id = Column(Integer, primary_key=True, index=True)
    shift_start = Column(DateTime(timezone=True), nullable=False)
    shift_end = Column(DateTime(timezone=True), nullable=False)
    summary_snapshot = Column(Text, nullable=False)
    vacant_count = Column(Integer, default=0)
    pending_viewing_count = Column(Integer, default=0)
    pending_exception_count = Column(Integer, default=0)
    today_viewing_count = Column(Integer, default=0)
    tomorrow_viewing_count = Column(Integer, default=0)
    outgoing_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    outgoing_confirmed = Column(Boolean, default=False)
    outgoing_confirmed_at = Column(DateTime(timezone=True))
    incoming_user_id = Column(Integer, ForeignKey("users.id"))
    incoming_confirmed = Column(Boolean, default=False)
    incoming_confirmed_at = Column(DateTime(timezone=True))
    outgoing_remarks = Column(Text)
    incoming_remarks = Column(Text)
    status = Column(String(20), default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    outgoing_user = relationship("User", foreign_keys=[outgoing_user_id])
    incoming_user = relationship("User", foreign_keys=[incoming_user_id])


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String(20), nullable=False)
    target_id = Column(Integer, nullable=False)
    operation_type = Column(String(50), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    remarks = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"))
    operator_name = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    operator = relationship("User", back_populates="operations")
