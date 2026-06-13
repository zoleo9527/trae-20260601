from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional, List
from enum import Enum


class JobStatus(Enum):
    ACTIVE = "招聘中"
    PAUSED = "暂停"
    CLOSED = "已关闭"
    EXPIRED = "已过期"


class InterviewStatus(Enum):
    SCHEDULED = "待面试"
    COMPLETED = "已面试"
    NO_SHOW = "爽约"
    CANCELLED = "已取消"
    PASSED = "通过"
    FAILED = "未通过"


class ReceiptStatus(Enum):
    PENDING = "待处理"
    VERIFIED = "已核实"
    REJECTED = "已驳回"
    ARCHIVED = "已归档"


class StabilityStatus(Enum):
    IN_PROGRESS = "稳定期中"
    COMPLETED = "已完成"
    EARLY_LEAVE = "提前离职"
    RISK = "风险预警"


class UserRole(Enum):
    OPERATOR = "运营"
    RECRUITER = "招聘顾问"
    HR = "企业HR"


@dataclass
class Job:
    id: Optional[int]
    title: str
    company: str
    location: str
    salary_range: str
    requirements: str
    benefits: str
    return_fee_condition: str
    return_fee_amount: float
    status: JobStatus
    publish_date: date
    expire_date: Optional[date]
    contact_person: str
    contact_phone: str
    created_at: datetime
    updated_at: datetime


@dataclass
class Interview:
    id: Optional[int]
    job_id: int
    candidate_name: str
    candidate_phone: str
    interview_time: datetime
    location: str
    interviewer: str
    status: InterviewStatus
    notes: str
    created_at: datetime
    updated_at: datetime


@dataclass
class OnboardingReceipt:
    id: Optional[int]
    interview_id: int
    candidate_name: str
    job_id: int
    company: str
    onboarding_date: date
    receipt_photo: Optional[str]
    receipt_number: str
    status: ReceiptStatus
    return_fee_due_date: Optional[date]
    return_fee_amount: float
    notes: str
    created_at: datetime
    updated_at: datetime


@dataclass
class StabilityTracking:
    id: Optional[int]
    receipt_id: int
    candidate_name: str
    company: str
    onboarding_date: date
    stability_period_days: int
    current_work_days: int
    status: StabilityStatus
    last_check_date: Optional[date]
    next_check_date: Optional[date]
    risk_notes: str
    return_fee_paid: bool
    return_fee_date: Optional[date]
    created_at: datetime
    updated_at: datetime


@dataclass
class ChangeLog:
    id: Optional[int]
    entity_type: str
    entity_id: int
    action: str
    old_value: str
    new_value: str
    operator: str
    created_at: datetime