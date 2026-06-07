from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from enum import Enum


class RoleEnum(str, Enum):
    STATION_MANAGER = "station_manager"
    CASHIER = "cashier"
    METER_READER = "meter_reader"


class RechargeStatusEnum(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"


class InvoiceStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RETURNED = "returned"
    COMPLETED = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    created_recharges = relationship("MemberRecharge", foreign_keys="MemberRecharge.created_by", back_populates="creator")
    handled_recharges = relationship("MemberRecharge", foreign_keys="MemberRecharge.handled_by", back_populates="handler")
    created_invoices = relationship("InvoiceReissue", foreign_keys="InvoiceReissue.created_by", back_populates="creator")
    handled_invoices = relationship("InvoiceReissue", foreign_keys="InvoiceReissue.handled_by", back_populates="handler")
    flow_logs = relationship("FlowLog", back_populates="operator")


class MemberRecharge(Base):
    __tablename__ = "member_recharges"

    id = Column(Integer, primary_key=True, index=True)
    member_name = Column(String(100), nullable=False)
    member_phone = Column(String(20), nullable=False)
    member_card_no = Column(String(50), nullable=False)
    recharge_amount = Column(Float, nullable=False)
    payment_method = Column(String(20), nullable=False)
    recharge_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default=RechargeStatusEnum.PENDING, nullable=False)
    remark = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    handled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by], back_populates="created_recharges")
    handler = relationship("User", foreign_keys=[handled_by], back_populates="handled_recharges")
    invoices = relationship("InvoiceReissue", back_populates="recharge")
    flow_logs = relationship("FlowLog", back_populates="recharge")


class InvoiceReissue(Base):
    __tablename__ = "invoice_reissues"

    id = Column(Integer, primary_key=True, index=True)
    recharge_id = Column(Integer, ForeignKey("member_recharges.id"), nullable=False)
    invoice_title = Column(String(200), nullable=False)
    tax_no = Column(String(50), nullable=False)
    invoice_amount = Column(Float, nullable=False)
    invoice_type = Column(String(20), nullable=False)
    recipient_email = Column(String(100), nullable=True)
    recipient_phone = Column(String(20), nullable=True)
    status = Column(String(20), default=InvoiceStatusEnum.PENDING, nullable=False)
    return_reason = Column(Text, nullable=True)
    supplement_remark = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    handled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    recharge = relationship("MemberRecharge", back_populates="invoices")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_invoices")
    handler = relationship("User", foreign_keys=[handled_by], back_populates="handled_invoices")
    flow_logs = relationship("FlowLog", back_populates="invoice")


class FlowLog(Base):
    __tablename__ = "flow_logs"

    id = Column(Integer, primary_key=True, index=True)
    recharge_id = Column(Integer, ForeignKey("member_recharges.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoice_reissues.id"), nullable=True)
    action = Column(String(50), nullable=False)
    action_desc = Column(String(200), nullable=False)
    from_status = Column(String(20), nullable=True)
    to_status = Column(String(20), nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recharge = relationship("MemberRecharge", back_populates="flow_logs")
    invoice = relationship("InvoiceReissue", back_populates="flow_logs")
    operator = relationship("User", back_populates="flow_logs")
