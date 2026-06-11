from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..database import Base


class FollowUpRecord(Base):
    __tablename__ = "follow_up_records"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visit_registrations.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    follow_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    follow_channel = Column(String(50))
    content = Column(Text, nullable=False)
    next_follow_plan = Column(String(500))
    next_follow_time = Column(DateTime)
    customer_response = Column(String(200))

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    visit = relationship("VisitRegistration", backref="follow_ups")
    customer = relationship("Customer", backref="follow_ups")
    agent = relationship("User", backref="follow_ups")
