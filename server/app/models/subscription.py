import enum
from datetime import datetime

from sqlalchemy import (Column, DateTime, Enum, ForeignKey, Integer, Numeric,
                        String, Text)
from sqlalchemy.orm import relationship

from ..database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_no = Column(String(32), unique=True, index=True, nullable=False)
    visit_id = Column(Integer, ForeignKey("visit_registrations.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    building_no = Column(String(50), nullable=False)
    unit_no = Column(String(50), nullable=False)
    room_no = Column(String(50), nullable=False)
    area = Column(Numeric(10, 2))
    total_price = Column(Numeric(15, 2), nullable=False)
    deposit_amount = Column(Numeric(15, 2))
    subscription_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    remark = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    visit = relationship("VisitRegistration", backref="subscriptions")
    customer = relationship("Customer", backref="subscriptions")
