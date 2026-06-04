from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    phone = Column(String, nullable=False)
    id_card = Column(String, nullable=False)
    surgery_date = Column(String, nullable=False)
    surgery_type = Column(String, nullable=False)
    surgeon_name = Column(String, nullable=False)
    eye = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    medication_tasks = relationship("MedicationTask", back_populates="patient")
    followup_tasks = relationship("FollowupTask", back_populates="patient")


class MedicationItem(Base):
    __tablename__ = "medication_items"

    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("medication_tasks.id"))
    name = Column(String, nullable=False)
    specification = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    notes = Column(Text)


class MedicationTask(Base):
    __tablename__ = "medication_tasks"

    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    status = Column(String, default="pending", nullable=False)
    surgeon_name = Column(String, nullable=False)
    nurse_name = Column(String)
    has_risk = Column(Boolean, default=False)
    risk_reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="medication_tasks")
    items = relationship("MedicationItem", cascade="all, delete-orphan")
    operation_logs = relationship("OperationLog", back_populates="medication_task")


class FollowupTask(Base):
    __tablename__ = "followup_tasks"

    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    scheduled_date = Column(String, nullable=False)
    scheduled_time = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False)
    followup_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    specialist_name = Column(String)
    previous_task_id = Column(String)
    has_risk = Column(Boolean, default=False)
    risk_reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="followup_tasks")
    operation_logs = relationship("OperationLog", back_populates="followup_task")


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(String, primary_key=True)
    medication_task_id = Column(String, ForeignKey("medication_tasks.id"))
    followup_task_id = Column(String, ForeignKey("followup_tasks.id"))
    task_type = Column(String, nullable=False)
    operator_name = Column(String, nullable=False)
    operator_role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    old_status = Column(String)
    new_status = Column(String)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    medication_task = relationship("MedicationTask", back_populates="operation_logs")
    followup_task = relationship("FollowupTask", back_populates="operation_logs")
