from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from .database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, index=True)
    entity_id = Column(Integer, index=True)
    action = Column(String)
    field_name = Column(String, nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    change_reason = Column(Text, nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"))
    operator_name = Column(String)
    created_at = Column(DateTime, default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String)
    department = Column(String)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, index=True)
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    consultation_type = Column(String)
    source_channel = Column(String, nullable=True)
    status = Column(String, default="new")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    consultation_records = relationship("ConsultationRecord", back_populates="customer")
    quotation_schemes = relationship("QuotationScheme", back_populates="customer")
    follow_ups = relationship("PostOperativeFollowUp", back_populates="customer")
    discomfort_reports = relationship("DiscomfortReport", back_populates="customer")


class ConsultationRecord(Base):
    __tablename__ = "consultation_records"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    consultation_date = Column(DateTime)
    consultant_id = Column(Integer, ForeignKey("users.id"))
    consultant_name = Column(String)
    chief_complaint = Column(Text)
    medical_history = Column(Text, nullable=True)
    aesthetic_expectation = Column(Text)
    recommended_projects = Column(JSON, default=list)
    promised_caliber = Column(Text, nullable=True)
    risk_notes = Column(Text, nullable=True)
    status = Column(String, default="draft")
    current_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="consultation_records")
    versions = relationship("ConsultationRecordVersion", back_populates="original")


class ConsultationRecordVersion(Base):
    __tablename__ = "consultation_record_versions"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("consultation_records.id"))
    version = Column(Integer)
    chief_complaint = Column(Text)
    recommended_projects = Column(JSON)
    promised_caliber = Column(Text, nullable=True)
    change_reason = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_by_name = Column(String)
    created_at = Column(DateTime, default=func.now())

    original = relationship("ConsultationRecord", back_populates="versions")


class QuotationScheme(Base):
    __tablename__ = "quotation_schemes"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    consultation_record_id = Column(Integer, ForeignKey("consultation_records.id"), nullable=True)
    scheme_name = Column(String)
    total_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    actual_amount = Column(Float, default=0)
    payment_method = Column(String, nullable=True)
    installment_months = Column(Integer, nullable=True)
    installment_amount = Column(Float, nullable=True)
    project_items = Column(JSON, default=list)
    promised_services = Column(JSON, default=list)
    special_notes = Column(Text, nullable=True)
    status = Column(String, default="draft")
    current_version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_by_name = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="quotation_schemes")
    versions = relationship("QuotationSchemeVersion", back_populates="original")


class QuotationSchemeVersion(Base):
    __tablename__ = "quotation_scheme_versions"

    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("quotation_schemes.id"))
    version = Column(Integer)
    total_amount = Column(Float)
    discount_amount = Column(Float)
    actual_amount = Column(Float)
    project_items = Column(JSON)
    promised_services = Column(JSON)
    change_reason = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_by_name = Column(String)
    created_at = Column(DateTime, default=func.now())

    original = relationship("QuotationScheme", back_populates="versions")


class PostOperativeFollowUp(Base):
    __tablename__ = "post_operative_follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    surgery_date = Column(DateTime)
    surgery_projects = Column(JSON, default=list)
    surgeon = Column(String, nullable=True)
    follow_up_stage = Column(String)
    follow_up_date = Column(DateTime)
    follow_up_type = Column(String)
    follow_up_person_id = Column(Integer, ForeignKey("users.id"))
    follow_up_person_name = Column(String)
    recovery_status = Column(String)
    customer_feedback = Column(Text)
    skin_condition = Column(JSON, nullable=True)
    pain_level = Column(Integer, nullable=True)
    swelling_level = Column(String, nullable=True)
    abnormal_symptoms = Column(Text, nullable=True)
    handling_advice = Column(Text, nullable=True)
    next_follow_up_date = Column(DateTime, nullable=True)
    has_discomfort = Column(Boolean, default=False)
    discomfort_report_id = Column(Integer, ForeignKey("discomfort_reports.id"), nullable=True)
    status = Column(String, default="pending")
    current_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="follow_ups")
    versions = relationship("FollowUpVersion", back_populates="original")


class FollowUpVersion(Base):
    __tablename__ = "follow_up_versions"

    id = Column(Integer, primary_key=True, index=True)
    follow_up_id = Column(Integer, ForeignKey("post_operative_follow_ups.id"))
    version = Column(Integer)
    recovery_status = Column(String)
    customer_feedback = Column(Text)
    abnormal_symptoms = Column(Text, nullable=True)
    handling_advice = Column(Text, nullable=True)
    status = Column(String)
    change_reason = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_by_name = Column(String)
    created_at = Column(DateTime, default=func.now())

    original = relationship("PostOperativeFollowUp", back_populates="versions")


class DiscomfortReport(Base):
    __tablename__ = "discomfort_reports"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    report_date = Column(DateTime)
    reporter = Column(String)
    reporter_phone = Column(String, nullable=True)
    discomfort_type = Column(String)
    discomfort_symptoms = Column(Text)
    severity = Column(String)
    related_projects = Column(JSON, default=list)
    related_surgery_date = Column(DateTime, nullable=True)
    first_handler_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    first_handler_name = Column(String, nullable=True)
    first_handling_time = Column(DateTime, nullable=True)
    first_handling_notes = Column(Text, nullable=True)
    current_handler_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    current_handler_name = Column(String, nullable=True)
    handling_process = Column(JSON, default=list)
    final_result = Column(Text, nullable=True)
    is_closed = Column(Boolean, default=False)
    closed_at = Column(DateTime, nullable=True)
    closed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    closed_by_name = Column(String, nullable=True)
    abnormal_description = Column(Text, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="discomfort_reports")
    handling_records = relationship("HandlingRecord", back_populates="discomfort_report")


class HandlingRecord(Base):
    __tablename__ = "handling_records"

    id = Column(Integer, primary_key=True, index=True)
    discomfort_report_id = Column(Integer, ForeignKey("discomfort_reports.id"))
    handler_id = Column(Integer, ForeignKey("users.id"))
    handler_name = Column(String)
    handling_action = Column(String)
    handling_notes = Column(Text)
    previous_status = Column(String, nullable=True)
    new_status = Column(String)
    next_step = Column(Text, nullable=True)
    notify_customer = Column(Boolean, default=False)
    notify_method = Column(String, nullable=True)
    attachment_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    discomfort_report = relationship("DiscomfortReport", back_populates="handling_records")
