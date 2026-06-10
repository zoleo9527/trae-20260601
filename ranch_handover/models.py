from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum,
    create_engine,
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone
import enum

Base = declarative_base()

DB_PATH = "ranch_handover.db"


class RoleEnum(str, enum.Enum):
    ranch_supervisor = "牧场主管"
    milker = "挤奶员"
    veterinarian = "兽医"


class FeedingPlanStatus(str, enum.Enum):
    draft = "草稿"
    pending_approval = "待审批"
    approved = "已审批"
    in_progress = "执行中"
    blocked = "已卡住"
    completed = "已完成"
    cancelled = "已取消"


class RequisitionStatus(str, enum.Enum):
    requested = "已申请"
    pending_approval = "待审批"
    approved = "已审批"
    issuing = "出库中"
    completed = "已完成"
    delayed = "已延迟"
    cancelled = "已取消"


class Staff(Base):
    __tablename__ = "staff"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), nullable=False)
    role = Column(String(32), nullable=False)
    shift = Column(String(32), default="白班")

    feeding_plans_created = relationship("FeedingPlan", back_populates="creator", foreign_keys="FeedingPlan.created_by")
    feeding_plans_assigned = relationship("FeedingPlan", back_populates="assignee", foreign_keys="FeedingPlan.assigned_to")
    feeding_plans_approved = relationship("FeedingPlan", back_populates="approver", foreign_keys="FeedingPlan.approved_by")
    requisitions_requested = relationship("InventoryRequisition", back_populates="requester", foreign_keys="InventoryRequisition.requested_by")
    requisitions_approved = relationship("InventoryRequisition", back_populates="approver_ref", foreign_keys="InventoryRequisition.approved_by")
    requisitions_issued = relationship("InventoryRequisition", back_populates="issuer_ref", foreign_keys="InventoryRequisition.issued_by")


class FeedingPlan(Base):
    __tablename__ = "feeding_plan"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_date = Column(String(16), nullable=False)
    cattle_group = Column(String(64), nullable=False)
    feed_formula = Column(String(128), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(16), default="kg")
    status = Column(String(32), nullable=False, default=FeedingPlanStatus.draft.value)
    created_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("staff.id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    blocked_reason = Column(Text, nullable=True)
    blocking_requisition_id = Column(Integer, ForeignKey("inventory_requisition.id"), nullable=True)
    blocked_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    creator = relationship("Staff", back_populates="feeding_plans_created", foreign_keys=[created_by])
    assignee = relationship("Staff", back_populates="feeding_plans_assigned", foreign_keys=[assigned_to])
    approver = relationship("Staff", back_populates="feeding_plans_approved", foreign_keys=[approved_by])
    requisitions = relationship("InventoryRequisition", back_populates="feeding_plan", cascade="all, delete-orphan", foreign_keys="InventoryRequisition.feeding_plan_id")
    blocking_requisition = relationship("InventoryRequisition", foreign_keys=[blocking_requisition_id])


class InventoryRequisition(Base):
    __tablename__ = "inventory_requisition"
    id = Column(Integer, primary_key=True, autoincrement=True)
    feeding_plan_id = Column(Integer, ForeignKey("feeding_plan.id"), nullable=True)
    item_name = Column(String(128), nullable=False)
    spec = Column(String(64), nullable=True)
    quantity_requested = Column(Float, nullable=False)
    quantity_issued = Column(Float, default=0.0)
    unit = Column(String(16), default="kg")
    status = Column(String(32), nullable=False, default=RequisitionStatus.requested.value)
    requested_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    issued_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    delay_reason = Column(Text, nullable=True)
    delayed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    feeding_plan = relationship("FeedingPlan", back_populates="requisitions", foreign_keys=[feeding_plan_id])
    requester = relationship("Staff", back_populates="requisitions_requested", foreign_keys=[requested_by])
    approver_ref = relationship("Staff", back_populates="requisitions_approved", foreign_keys=[approved_by])
    issuer_ref = relationship("Staff", back_populates="requisitions_issued", foreign_keys=[issued_by])


class OperationLog(Base):
    __tablename__ = "operation_log"
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(32), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(64), nullable=False)
    operator_name = Column(String(64), nullable=False)
    operator_role = Column(String(32), nullable=False)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_engine(db_path=None):
    if db_path is None:
        db_path = DB_PATH
    engine = create_engine(f"sqlite:///{db_path}", echo=False)
    Base.metadata.create_all(engine)
    return engine
