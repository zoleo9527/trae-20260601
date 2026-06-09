from __future__ import annotations
from datetime import date, datetime, time
from typing import List, Optional
from uuid import UUID
from ninja import Schema


class PatientIn(Schema):
    name: str
    gender: str = ''
    age: Optional[int] = None
    diagnosis: str = ''
    phone: str = ''


class PatientOut(Schema):
    id: UUID
    name: str
    gender: str
    age: Optional[int]
    diagnosis: str
    phone: str
    created_at: datetime
    updated_at: datetime


class EquipmentIn(Schema):
    name: str
    code: str
    category: str = ''
    status: str = 'available'
    location: str = ''
    notes: str = ''


class EquipmentOut(Schema):
    id: UUID
    name: str
    code: str
    category: str
    status: str
    location: str
    notes: str
    created_at: datetime
    updated_at: datetime


class AssessmentIn(Schema):
    motor_function: str = ''
    pain_level: Optional[int] = None
    range_of_motion: str = ''
    treatment_goal: str = ''
    equipment_requirement: str = ''
    notes: str = ''


class AssessmentOut(Schema):
    id: UUID
    order_id: UUID
    order_no: str
    motor_function: str
    pain_level: Optional[int]
    range_of_motion: str
    treatment_goal: str
    equipment_requirement: str
    notes: str
    created_at: datetime
    updated_at: datetime


class CreateOrderIn(Schema):
    patient_id: UUID
    assessment: AssessmentIn


class AssignEquipmentIn(Schema):
    equipment_id: UUID
    scheduled_date: date
    scheduled_time_start: time
    scheduled_time_end: time


class UsageRecordIn(Schema):
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    actual_usage: str = ''
    patient_feedback: str = ''
    abnormal: bool = False
    abnormal_note: str = ''


class UsageRecordOut(Schema):
    id: UUID
    order_id: UUID
    order_no: str
    operator_id: int
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: Optional[int]
    actual_usage: str
    patient_feedback: str
    abnormal: bool
    abnormal_note: str
    created_at: datetime


class OrderOut(Schema):
    id: UUID
    order_no: str
    patient_id: UUID
    patient_name: str
    equipment_id: Optional[UUID]
    equipment_name: Optional[str]
    status: str
    status_display: str
    therapist_id: int
    receptionist_id: Optional[int]
    reviewer_id: Optional[int]
    scheduled_date: Optional[date]
    scheduled_time_start: Optional[time]
    scheduled_time_end: Optional[time]
    exception_reason: str
    return_reason: str
    return_target_status: str
    created_at: datetime
    updated_at: datetime


class OrderDetailOut(OrderOut):
    assessment: Optional[AssessmentOut]
    usage_records: List[UsageRecordOut]


class AlertOut(Schema):
    id: UUID
    order_id: UUID
    order_no: str
    level: str
    message: str
    handled: str
    handler_id: Optional[int]
    handled_at: Optional[datetime]
    created_at: datetime


class HandleAlertIn(Schema):
    action: str
    return_target_status: str = ''
    return_reason: str = ''


class ExceptionIn(Schema):
    reason: str


class ReturnOrderIn(Schema):
    target_status: str
    reason: str


class ReviewOrderIn(Schema):
    pass_type: str = 'approve'


class StuckOrderOut(Schema):
    order: OrderOut
    stuck_hours: float
    timeout_threshold: int
    alerts: List[AlertOut]


class ErrorResponse(Schema):
    code: str
    message: str
    detail: dict = {}


class SuccessResponse(Schema):
    code: str = 'OK'
    message: str = 'success'
    data: dict = {}
