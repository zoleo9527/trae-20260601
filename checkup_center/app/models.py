from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    role = Column(String(20), nullable=False)
    department = Column(String(50))

    checkup_items = relationship("CheckupItem", back_populates="operator")
    recommendations = relationship("FollowUpRecommendation", back_populates="creator")
    reviewed_reports = relationship("Report", foreign_keys="Report.reviewed_by", back_populates="reviewer")
    released_reports = relationship("Report", foreign_keys="Report.released_by", back_populates="releaser")
    sent_notifications = relationship("Notification", back_populates="sender")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    gender = Column(String(10), nullable=False)
    age = Column(Integer, nullable=False)
    phone = Column(String(20), nullable=False)
    id_number = Column(String(30), unique=True, nullable=False)

    records = relationship("CheckupRecord", back_populates="patient")
    notifications = relationship("Notification", back_populates="patient")


class CheckupRecord(Base):
    __tablename__ = "checkup_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    checkup_date = Column(Date, nullable=False, default=date.today)
    status = Column(String(20), nullable=False, default="pending")

    patient = relationship("Patient", back_populates="records")
    items = relationship("CheckupItem", back_populates="record", cascade="all, delete-orphan")
    abnormal_indicators = relationship("AbnormalIndicator", back_populates="record", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="record", uselist=False)
    notifications = relationship("Notification", back_populates="record")


class CheckupItem(Base):
    __tablename__ = "checkup_items"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("checkup_records.id"), nullable=False)
    item_name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    result = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"))
    completed_at = Column(DateTime)

    record = relationship("CheckupRecord", back_populates="items")
    operator = relationship("User", back_populates="checkup_items")
    abnormal_indicators = relationship("AbnormalIndicator", back_populates="item")


class AbnormalIndicator(Base):
    __tablename__ = "abnormal_indicators"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("checkup_items.id"), nullable=False)
    record_id = Column(Integer, ForeignKey("checkup_records.id"), nullable=False)
    indicator_name = Column(String(100), nullable=False)
    indicator_value = Column(String(50), nullable=False)
    reference_range = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    discovered_at = Column(DateTime, nullable=False, default=datetime.now)

    item = relationship("CheckupItem", back_populates="abnormal_indicators")
    record = relationship("CheckupRecord", back_populates="abnormal_indicators")
    recommendations = relationship("FollowUpRecommendation", back_populates="indicator", cascade="all, delete-orphan")


class FollowUpRecommendation(Base):
    __tablename__ = "follow_up_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    indicator_id = Column(Integer, ForeignKey("abnormal_indicators.id"), nullable=False)
    record_id = Column(Integer, ForeignKey("checkup_records.id"), nullable=False)
    recommendation = Column(Text, nullable=False)
    follow_up_type = Column(String(30), nullable=False)
    deadline = Column(Date)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    is_completed = Column(Integer, default=0)

    indicator = relationship("AbnormalIndicator", back_populates="recommendations")
    record = relationship("CheckupRecord")
    creator = relationship("User", back_populates="recommendations")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("checkup_records.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    type = Column(String(30), nullable=False)
    channel = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    content = Column(Text, nullable=False)
    sent_by = Column(Integer, ForeignKey("users.id"))
    sent_at = Column(DateTime)
    confirmed_at = Column(DateTime)

    record = relationship("CheckupRecord", back_populates="notifications")
    patient = relationship("Patient", back_populates="notifications")
    sender = relationship("User", back_populates="sent_notifications")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("checkup_records.id"), unique=True, nullable=False)
    status = Column(String(20), nullable=False, default="draft")
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    review_comment = Column(Text)
    released_by = Column(Integer, ForeignKey("users.id"))
    released_at = Column(DateTime)

    record = relationship("CheckupRecord", back_populates="report")
    reviewer = relationship("User", foreign_keys=[reviewed_by], back_populates="reviewed_reports")
    releaser = relationship("User", foreign_keys=[released_by], back_populates="released_reports")
