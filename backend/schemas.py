from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime


class MedicationItemBase(BaseModel):
    name: str
    specification: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str] = None


class MedicationItemCreate(MedicationItemBase):
    id: str


class MedicationItem(MedicationItemBase):
    id: str

    class Config:
        from_attributes = True


class PatientBase(BaseModel):
    name: str
    gender: str
    age: int
    phone: str
    id_card: str
    surgery_date: str
    surgery_type: str
    surgeon_name: str
    eye: str


class PatientCreate(PatientBase):
    id: str


class Patient(PatientBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MedicationTaskBase(BaseModel):
    patient_id: str
    surgeon_name: str


class MedicationTaskCreate(MedicationTaskBase):
    id: str
    items: List[MedicationItemCreate]


class MedicationTask(MedicationTaskBase):
    id: str
    status: str
    nurse_name: Optional[str] = None
    has_risk: bool = False
    risk_reason: Optional[str] = None
    items: List[MedicationItem] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    patient: Patient

    class Config:
        from_attributes = True


class FollowupTaskBase(BaseModel):
    patient_id: str
    scheduled_date: str
    scheduled_time: str
    followup_type: str
    content: str


class FollowupTaskCreate(FollowupTaskBase):
    id: str


class FollowupTask(FollowupTaskBase):
    id: str
    status: str
    specialist_name: Optional[str] = None
    previous_task_id: Optional[str] = None
    has_risk: bool = False
    risk_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    patient: Patient

    class Config:
        from_attributes = True


class OperationLogBase(BaseModel):
    task_type: str
    operator_name: str
    operator_role: str
    action: str
    description: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    remark: Optional[str] = None


class OperationLogCreate(OperationLogBase):
    id: str
    medication_task_id: Optional[str] = None
    followup_task_id: Optional[str] = None


class OperationLog(OperationLogBase):
    id: str
    medication_task_id: Optional[str] = None
    followup_task_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProcessMedicationRequest(BaseModel):
    action: str
    status: str
    remark: Optional[str] = None
    nurse_name: Optional[str] = None


class ProcessFollowupRequest(BaseModel):
    action: str
    status: str
    remark: str
    specialist_name: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None

    @field_validator('remark')
    @classmethod
    def remark_must_be_non_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError('请输入处理备注，说明为什么要这样处理')
        return stripped


class TodoItem(BaseModel):
    id: str
    type: str
    patientName: str
    title: str
    priority: str
    time: str


class RiskItem(BaseModel):
    id: str
    type: str
    patientName: str
    reason: str
    level: str


class RecentChange(BaseModel):
    id: str
    type: str
    patientName: str
    action: str
    operatorName: str
    time: str


class DashboardStats(BaseModel):
    todoCount: int
    riskCount: int
    todayMedicationCount: int
    todayFollowupCount: int
    pendingMedicationCount: int
    pendingFollowupCount: int
    todoItems: List[TodoItem]
    riskItems: List[RiskItem]
    recentChanges: List[RecentChange]
