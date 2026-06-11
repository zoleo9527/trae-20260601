from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(50))
    name = Column(String(100))

    created_tenants = relationship("Tenant", back_populates="creator")
    handled_complaints = relationship("Complaint", back_populates="handler_user")


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200))
    shop_number = Column(String(50))
    contact = Column(String(100))
    phone = Column(String(20))
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))

    creator = relationship("User", back_populates="created_tenants")
    licenses = relationship("License", back_populates="tenant", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="tenant", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="tenant", cascade="all, delete-orphan")


class License(Base):
    __tablename__ = "licenses"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    license_type = Column(String(100))
    license_number = Column(String(100))
    expire_date = Column(String(50))
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="licenses")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    title = Column(String(200))
    content = Column(Text)
    start_date = Column(String(50))
    end_date = Column(String(50))
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="activities")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    title = Column(String(200))
    content = Column(Text)
    status = Column(String(50), default="pending")
    handler = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="complaints")
    handler_user = relationship("User", back_populates="handled_complaints")


class HistoryRecord(Base):
    __tablename__ = "history_records"

    id = Column(Integer, primary_key=True, index=True)
    related_type = Column(String(50))
    related_id = Column(Integer)
    action = Column(String(100))
    remark = Column(Text, nullable=True)
    operator_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
