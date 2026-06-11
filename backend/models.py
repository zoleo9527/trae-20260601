from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(50), nullable=False)
    role = Column(String(20), nullable=False)
    floor = Column(String(20))
    brand = Column(String(100))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    created_allocations = relationship("GoodsAllocation", back_populates="creator", foreign_keys="GoodsAllocation.created_by")
    updated_allocations = relationship("GoodsAllocation", back_populates="updater", foreign_keys="GoodsAllocation.updated_by")
    created_reviews = relationship("CabinetReview", back_populates="reviewer", foreign_keys="CabinetReview.reviewed_by")


class GoodsAllocation(Base):
    __tablename__ = "goods_allocations"

    id = Column(Integer, primary_key=True, index=True)
    allocation_no = Column(String(30), unique=True, index=True, nullable=False)
    idempotent_key = Column(String(64), unique=True, index=True, nullable=False)

    from_counter = Column(String(100), nullable=False)
    to_counter = Column(String(100), nullable=False)
    brand = Column(String(100), nullable=False)
    floor = Column(String(20), nullable=False)

    goods_code = Column(String(50), nullable=False)
    goods_name = Column(String(200), nullable=False)
    sku = Column(String(100))
    quantity = Column(Integer, nullable=False)
    unit = Column(String(20), default="件")

    status = Column(String(30), default="pending", nullable=False)

    remark = Column(Text)
    history_remark = Column(Text)

    version = Column(Integer, default=1, nullable=False)
    is_modified = Column(Boolean, default=False, nullable=False)
    last_modified_at = Column(DateTime)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    creator = relationship("User", back_populates="created_allocations", foreign_keys=[created_by])
    updater = relationship("User", back_populates="updated_allocations", foreign_keys=[updated_by])
    change_logs = relationship("AllocationChangeLog", back_populates="allocation", cascade="all, delete-orphan")
    reviews = relationship("CabinetReview", back_populates="allocation", cascade="all, delete-orphan")


class AllocationChangeLog(Base):
    __tablename__ = "allocation_change_logs"

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("goods_allocations.id"), nullable=False)
    allocation = relationship("GoodsAllocation", back_populates="change_logs")

    field_name = Column(String(50), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)

    change_reason = Column(Text)
    operated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    operated_at = Column(DateTime, default=func.now(), nullable=False)

    operator = relationship("User", foreign_keys=[operated_by])


class CabinetReview(Base):
    __tablename__ = "cabinet_reviews"

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("goods_allocations.id"), nullable=False)
    allocation = relationship("GoodsAllocation", back_populates="reviews")

    review_no = Column(String(30), unique=True, index=True, nullable=False)

    actual_quantity = Column(Integer)
    review_status = Column(String(30), default="pending", nullable=False)

    difference_reason = Column(Text)
    has_allocation_modified = Column(Boolean, default=False, nullable=False)
    modification_acknowledged = Column(Boolean, default=False)

    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewed_at = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    reviewer = relationship("User", back_populates="created_reviews", foreign_keys=[reviewed_by])
