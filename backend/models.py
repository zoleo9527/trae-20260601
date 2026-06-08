from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(String)
    hashed_password = Column(String)


class FeedingPlan(Base):
    __tablename__ = "feeding_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_no = Column(String, unique=True, index=True)
    pond_no = Column(String)
    breed_type = Column(String)
    feed_type = Column(String)
    daily_amount = Column(Float)
    frequency = Column(Integer)
    start_date = Column(String)
    end_date = Column(String)
    status = Column(String, default="draft")
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    remark = Column(Text, default="")

    status_logs = relationship("StatusLog", back_populates="feeding_plan", foreign_keys="StatusLog.feeding_plan_id")
    feed_requisitions = relationship("FeedRequisition", back_populates="feeding_plan")


class FeedRequisition(Base):
    __tablename__ = "feed_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    req_no = Column(String, unique=True, index=True)
    feeding_plan_id = Column(Integer, ForeignKey("feeding_plans.id"))
    pond_no = Column(String)
    feed_type = Column(String)
    amount = Column(Float)
    status = Column(String, default="pending")
    requested_by = Column(String)
    requested_at = Column(DateTime, default=datetime.utcnow)
    issued_by = Column(String, default="")
    issued_at = Column(DateTime, nullable=True)
    received_by = Column(String, default="")
    received_at = Column(DateTime, nullable=True)
    remark = Column(Text, default="")

    feeding_plan = relationship("FeedingPlan", back_populates="feed_requisitions")
    status_logs = relationship("StatusLog", back_populates="feed_requisition", foreign_keys="StatusLog.feed_requisition_id")


class StatusLog(Base):
    __tablename__ = "status_logs"

    id = Column(Integer, primary_key=True, index=True)
    feeding_plan_id = Column(Integer, ForeignKey("feeding_plans.id"), nullable=True)
    feed_requisition_id = Column(Integer, ForeignKey("feed_requisitions.id"), nullable=True)
    from_status = Column(String)
    to_status = Column(String)
    operator = Column(String)
    operator_role = Column(String)
    operated_at = Column(DateTime, default=datetime.utcnow)
    remark = Column(Text, default="")

    feeding_plan = relationship("FeedingPlan", back_populates="status_logs", foreign_keys=[feeding_plan_id])
    feed_requisition = relationship("FeedRequisition", back_populates="status_logs", foreign_keys=[feed_requisition_id])
