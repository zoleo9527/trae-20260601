import enum
from datetime import datetime

from sqlalchemy import (Column, DateTime, Enum, ForeignKey, Integer, String,
                        Text)
from sqlalchemy.orm import relationship

from ..database import Base


class VisitStatus(str, enum.Enum):
    REGISTERED = "registered"
    ASSIGNED = "assigned"
    FOLLOWING = "following"
    SUBSCRIBED = "subscribed"
    LOST = "lost"


VISIT_STATUS_LABELS = {
    VisitStatus.REGISTERED: "已登记",
    VisitStatus.ASSIGNED: "已分配",
    VisitStatus.FOLLOWING: "跟进中",
    VisitStatus.SUBSCRIBED: "已认购",
    VisitStatus.LOST: "已流失",
}


class VisitType(str, enum.Enum):
    FIRST = "first"
    REPEAT = "repeat"
    OLD = "old"


VISIT_TYPE_LABELS = {
    VisitType.FIRST: "首次来访",
    VisitType.REPEAT: "再次来访",
    VisitType.OLD: "老客户回访",
}


class VisitRegistration(Base):
    __tablename__ = "visit_registrations"

    id = Column(Integer, primary_key=True, index=True)
    visit_no = Column(String(32), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    visit_type = Column(Enum(VisitType), default=VisitType.FIRST, nullable=False)
    visit_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(Enum(VisitStatus), default=VisitStatus.REGISTERED, nullable=False)

    intent_level = Column(String(20))
    interested_house_type = Column(String(100))
    accompany_number = Column(Integer, default=0)
    has_agent = Column(Integer, default=0)
    agent_name = Column(String(100))
    agent_phone = Column(String(20))

    registered_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_agent_id = Column(Integer, ForeignKey("users.id"))
    assigned_at = Column(DateTime)
    assigned_by = Column(Integer, ForeignKey("users.id"))

    remark = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("Customer", backref="visits")
    register_user = relationship("User", foreign_keys=[registered_by])
    assigned_agent = relationship("User", foreign_keys=[assigned_agent_id])
