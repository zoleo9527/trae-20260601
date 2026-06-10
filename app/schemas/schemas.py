from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.models import (
    AlertSeverity,
    AlertStatus,
    BatchStatus,
    ExecutionResult,
    MedicationType,
    PenType,
    PlanStatus,
    WithdrawalBlockReason,
)


class PenBase(BaseModel):
    pen_code: str = Field(max_length=32)
    pen_name: str = Field(max_length=64)
    pen_type: PenType
    capacity: int = Field(default=20)
    current_count: int = Field(default=0)
    building: str | None = None


class PenCreate(PenBase):
    pass


class PenRead(PenBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PigBatchBase(BaseModel):
    batch_code: str = Field(max_length=32)
    breed: str = Field(max_length=32)
    batch_status: BatchStatus = BatchStatus.ACTIVE
    head_count: int
    entry_date: date
    pen_id: int
    source_pen_id: int | None = None
    transfer_date: date | None = None
    notes: str | None = None


class PigBatchCreate(PigBatchBase):
    pass


class PigBatchRead(PigBatchBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class PigBatchDetail(PigBatchRead):
    pen: PenRead | None = None
    source_pen: PenRead | None = None
    model_config = {"from_attributes": True}


class ImmunizationPlanBase(BaseModel):
    batch_id: int
    vaccine_name: str = Field(max_length=128)
    planned_date: date
    planned_dose: float
    dose_unit: str = Field(default="ml", max_length=16)
    route: str = Field(max_length=32)
    plan_status: PlanStatus = PlanStatus.PENDING
    applicable_week_age: int | None = None
    booster_required: bool = False
    booster_date: date | None = None
    responsible_role: str = Field(default="繁育员", max_length=32)


class ImmunizationPlanCreate(ImmunizationPlanBase):
    pass


class ImmunizationPlanRead(ImmunizationPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class ImmunizationPlanDetail(ImmunizationPlanRead):
    batch: PigBatchRead | None = None
    model_config = {"from_attributes": True}


class ImmunizationExecutionBase(BaseModel):
    plan_id: int
    batch_id: int
    execution_date: date
    executor: str = Field(max_length=32)
    actual_dose: float
    result: ExecutionResult
    reason: str | None = None
    head_count_executed: int


class ImmunizationExecutionCreate(ImmunizationExecutionBase):
    pass


class ImmunizationExecutionRead(ImmunizationExecutionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class ImmunizationExecutionDetail(ImmunizationExecutionRead):
    plan: ImmunizationPlanRead | None = None
    batch: PigBatchRead | None = None
    model_config = {"from_attributes": True}


class MedicationRecordBase(BaseModel):
    batch_id: int
    pen_id: int
    medication_type: MedicationType
    drug_name: str = Field(max_length=128)
    reason: str
    diagnosis: str | None = None
    dosage: float
    dosage_unit: str = Field(default="ml", max_length=16)
    route: str = Field(max_length=32)
    frequency: str = Field(max_length=32)
    start_date: date
    end_date: date
    withdrawal_days: int
    withdrawal_end_date: date
    is_isolation: bool = False
    veterinarian: str = Field(max_length=32)
    head_count_treated: int


class MedicationRecordCreate(MedicationRecordBase):
    pass


class MedicationRecordRead(MedicationRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class MedicationRecordDetail(MedicationRecordRead):
    batch: PigBatchRead | None = None
    pen: PenRead | None = None
    model_config = {"from_attributes": True}


class AbnormalAlertBase(BaseModel):
    batch_id: int | None = None
    pen_id: int | None = None
    alert_type: str = Field(max_length=64)
    severity: AlertSeverity
    title: str = Field(max_length=256)
    detail: str
    alert_status: AlertStatus = AlertStatus.ACTIVE
    block_reason: WithdrawalBlockReason | None = None
    related_record_id: int | None = None
    related_record_type: str | None = None


class AbnormalAlertCreate(AbnormalAlertBase):
    pass


class AbnormalAlertRead(AbnormalAlertBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class WithdrawalCheckRequest(BaseModel):
    batch_id: int
    action: WithdrawalBlockReason
    planned_date: date


class WithdrawalCheckResult(BaseModel):
    blocked: bool
    batch_id: int
    action: WithdrawalBlockReason
    planned_date: date
    blocking_records: list[MedicationRecordRead] = []
    message: str = ""


class BatchTimelineItem(BaseModel):
    event_type: str
    event_date: date
    title: str
    detail: str
    related_id: int
    pen_name: str | None = None


class BatchTimeline(BaseModel):
    batch_id: int
    batch_code: str
    events: list[BatchTimelineItem]
