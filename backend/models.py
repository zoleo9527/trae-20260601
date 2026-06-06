from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    student_no = Column(String, unique=True, nullable=False)
    building = Column(String, nullable=False)
    room = Column(String, nullable=False)
    phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Key(Base):
    __tablename__ = "keys"

    id = Column(Integer, primary_key=True, index=True)
    key_number = Column(String, unique=True, nullable=False)
    building = Column(String, nullable=False)
    room = Column(String, nullable=False)
    key_type = Column(String, default="room")
    status = Column(String, default="available")
    current_holder = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    borrow_records = relationship("BorrowRecord", back_populates="key")
    lost_records = relationship("LostRecord", back_populates="key", foreign_keys="LostRecord.key_id")


class BorrowRecord(Base):
    __tablename__ = "borrow_records"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(Integer, ForeignKey("keys.id"))
    student_id = Column(String, ForeignKey("students.id"))
    student_name = Column(String, nullable=False)
    borrower_role = Column(String, default="student")
    borrow_time = Column(DateTime, default=datetime.utcnow)
    expected_return_time = Column(DateTime, nullable=False)
    actual_return_time = Column(DateTime)
    is_overdue = Column(Boolean, default=False)
    operator = Column(String, nullable=False)
    remark = Column(Text)

    key = relationship("Key", back_populates="borrow_records")


class LostRecord(Base):
    __tablename__ = "lost_records"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(Integer, ForeignKey("keys.id"))
    student_name = Column(String, nullable=False)
    lost_time = Column(DateTime, default=datetime.utcnow)
    lost_reason = Column(Text, nullable=False)
    replace_fee = Column(Float)
    replace_time = Column(DateTime)
    new_key_id = Column(Integer, ForeignKey("keys.id"))
    status = Column(String, default="lost")
    operator = Column(String, nullable=False)

    key = relationship("Key", back_populates="lost_records", foreign_keys=[key_id])


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(Integer, ForeignKey("keys.id"))
    action = Column(String, nullable=False)
    operator = Column(String, nullable=False)
    operator_role = Column(String, nullable=False)
    detail = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
