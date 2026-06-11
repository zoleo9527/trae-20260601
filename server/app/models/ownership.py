import enum
from datetime import datetime

from sqlalchemy import (Column, DateTime, Enum, ForeignKey, Integer, Numeric,
                        String, Text)
from sqlalchemy.orm import relationship

from ..database import Base


class OwnershipStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DISPUTED = "disputed"
    RESOLVED = "resolved"


OWNERSHIP_STATUS_LABELS = {
    OwnershipStatus.PENDING: "待确认",
    OwnershipStatus.CONFIRMED: "已确认",
    OwnershipStatus.DISPUTED: "有争议",
    OwnershipStatus.RESOLVED: "争议已裁决",
}


class OwnershipRecord(Base):
    __tablename__ = "ownership_records"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visit_registrations.id"), nullable=False, unique=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"))

    claimed_agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    confirm_agent_id = Column(Integer, ForeignKey("users.id"))
    confirmed_by = Column(Integer, ForeignKey("users.id"))

    status = Column(Enum(OwnershipStatus), default=OwnershipStatus.PENDING, nullable=False)

    ownership_reason = Column(String(300))
    dispute_reason = Column(String(300))
    resolve_reason = Column(String(300))

    commission_amount = Column(Numeric(15, 2))
    commission_ratio = Column(Numeric(5, 4))

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime)
    disputed_at = Column(DateTime)
    resolved_at = Column(DateTime)

    visit = relationship("VisitRegistration", backref="ownership")
    customer = relationship("Customer", backref="ownerships")
    claimed_agent = relationship("User", foreign_keys=[claimed_agent_id])
    confirm_agent = relationship("User", foreign_keys=[confirm_agent_id])
    confirmer = relationship("User", foreign_keys=[confirmed_by])
