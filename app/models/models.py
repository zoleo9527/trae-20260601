import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class PenType(str, enum.Enum):
    GESTATION = "妊娠舍"
    FARROWING = "分娩舍"
    NURSERY = "保育舍"
    FINISHING = "育肥舍"
    ISOLATION = "隔离舍"
    BOAR = "公猪舍"


class BatchStatus(str, enum.Enum):
    ACTIVE = "在群"
    ISOLATED = "隔离中"
    CULLED = "已淘汰"
    SOLD = "已销售"
    TRANSFERRED = "已转栏"


class PlanStatus(str, enum.Enum):
    PENDING = "待执行"
    IN_PROGRESS = "执行中"
    COMPLETED = "已完成"
    OVERDUE = "已逾期"


class ExecutionResult(str, enum.Enum):
    COMPLETED = "正常完成"
    MISSED = "漏打"
    MAKEUP = "补打"
    DELAYED = "延迟执行"


class MedicationType(str, enum.Enum):
    ANTIBIOTIC = "抗生素"
    ANTIPARASITIC = "抗寄生虫"
    ANTI_INFLAMMATORY = "抗炎药"
    VACCINE = "疫苗辅助"
    OTHER = "其他"


class AlertSeverity(str, enum.Enum):
    INFO = "提示"
    WARNING = "警告"
    CRITICAL = "严重"


class AlertStatus(str, enum.Enum):
    ACTIVE = "待处理"
    ACKNOWLEDGED = "已确认"
    RESOLVED = "已解决"


class WithdrawalBlockReason(str, enum.Enum):
    TRANSFER = "转栏"
    CULL = "淘汰"
    SALE = "销售"


class Pen(Base):
    __tablename__ = "pens"

    pen_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    pen_name: Mapped[str] = mapped_column(String(64), nullable=False)
    pen_type: Mapped[PenType] = mapped_column(Enum(PenType), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    current_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    building: Mapped[str | None] = mapped_column(String(64))

    batches: Mapped[list["PigBatch"]] = relationship(
        back_populates="pen", foreign_keys="PigBatch.pen_id"
    )


class PigBatch(Base):
    __tablename__ = "pig_batches"

    batch_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    breed: Mapped[str] = mapped_column(String(32), nullable=False)
    batch_status: Mapped[BatchStatus] = mapped_column(
        Enum(BatchStatus), nullable=False, default=BatchStatus.ACTIVE
    )
    head_count: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    pen_id: Mapped[int] = mapped_column(ForeignKey("pens.id"), nullable=False)
    source_pen_id: Mapped[int | None] = mapped_column(ForeignKey("pens.id"))
    transfer_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)

    pen: Mapped["Pen"] = relationship(back_populates="batches", foreign_keys=[pen_id])
    source_pen: Mapped["Pen | None"] = relationship(foreign_keys=[source_pen_id])
    immunization_plans: Mapped[list["ImmunizationPlan"]] = relationship(
        back_populates="batch"
    )
    executions: Mapped[list["ImmunizationExecution"]] = relationship(
        back_populates="batch"
    )
    medication_records: Mapped[list["MedicationRecord"]] = relationship(
        back_populates="batch"
    )


class ImmunizationPlan(Base):
    __tablename__ = "immunization_plans"

    batch_id: Mapped[int] = mapped_column(
        ForeignKey("pig_batches.id"), nullable=False
    )
    vaccine_name: Mapped[str] = mapped_column(String(128), nullable=False)
    planned_date: Mapped[date] = mapped_column(Date, nullable=False)
    planned_dose: Mapped[float] = mapped_column(Float, nullable=False)
    dose_unit: Mapped[str] = mapped_column(String(16), nullable=False, default="ml")
    route: Mapped[str] = mapped_column(String(32), nullable=False)
    plan_status: Mapped[PlanStatus] = mapped_column(
        Enum(PlanStatus), nullable=False, default=PlanStatus.PENDING
    )
    applicable_week_age: Mapped[int | None] = mapped_column(Integer)
    booster_required: Mapped[bool] = mapped_column(Boolean, default=False)
    booster_date: Mapped[date | None] = mapped_column(Date)
    responsible_role: Mapped[str] = mapped_column(String(32), nullable=False, default="繁育员")

    batch: Mapped["PigBatch"] = relationship(back_populates="immunization_plans")
    executions: Mapped[list["ImmunizationExecution"]] = relationship(
        back_populates="plan"
    )


class ImmunizationExecution(Base):
    __tablename__ = "immunization_executions"

    plan_id: Mapped[int] = mapped_column(
        ForeignKey("immunization_plans.id"), nullable=False
    )
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("pig_batches.id"), nullable=False
    )
    execution_date: Mapped[date] = mapped_column(Date, nullable=False)
    executor: Mapped[str] = mapped_column(String(32), nullable=False)
    actual_dose: Mapped[float] = mapped_column(Float, nullable=False)
    result: Mapped[ExecutionResult] = mapped_column(
        Enum(ExecutionResult), nullable=False
    )
    reason: Mapped[str | None] = mapped_column(Text)
    head_count_executed: Mapped[int] = mapped_column(Integer, nullable=False)

    plan: Mapped["ImmunizationPlan"] = relationship(back_populates="executions")
    batch: Mapped["PigBatch"] = relationship(back_populates="executions")


class MedicationRecord(Base):
    __tablename__ = "medication_records"

    batch_id: Mapped[int] = mapped_column(
        ForeignKey("pig_batches.id"), nullable=False
    )
    pen_id: Mapped[int] = mapped_column(ForeignKey("pens.id"), nullable=False)
    medication_type: Mapped[MedicationType] = mapped_column(
        Enum(MedicationType), nullable=False
    )
    drug_name: Mapped[str] = mapped_column(String(128), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    diagnosis: Mapped[str | None] = mapped_column(Text)
    dosage: Mapped[float] = mapped_column(Float, nullable=False)
    dosage_unit: Mapped[str] = mapped_column(String(16), nullable=False, default="ml")
    route: Mapped[str] = mapped_column(String(32), nullable=False)
    frequency: Mapped[str] = mapped_column(String(32), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    withdrawal_days: Mapped[int] = mapped_column(Integer, nullable=False)
    withdrawal_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_isolation: Mapped[bool] = mapped_column(Boolean, default=False)
    veterinarian: Mapped[str] = mapped_column(String(32), nullable=False)
    head_count_treated: Mapped[int] = mapped_column(Integer, nullable=False)

    batch: Mapped["PigBatch"] = relationship(back_populates="medication_records")
    pen: Mapped["Pen"] = relationship()


class AbnormalAlert(Base):
    __tablename__ = "abnormal_alerts"

    batch_id: Mapped[int | None] = mapped_column(ForeignKey("pig_batches.id"))
    pen_id: Mapped[int | None] = mapped_column(ForeignKey("pens.id"))
    alert_type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity), nullable=False
    )
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    alert_status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus), nullable=False, default=AlertStatus.ACTIVE
    )
    block_reason: Mapped[WithdrawalBlockReason | None] = mapped_column(
        Enum(WithdrawalBlockReason)
    )
    related_record_id: Mapped[int | None] = mapped_column(Integer)
    related_record_type: Mapped[str | None] = mapped_column(String(64))
