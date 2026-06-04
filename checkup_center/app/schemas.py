from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel


class UserBase(BaseModel):
    username: str
    name: str
    role: str
    department: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True


class PatientBase(BaseModel):
    name: str
    gender: str
    age: int
    phone: str
    id_number: str


class PatientCreate(PatientBase):
    pass


class PatientOut(PatientBase):
    id: int

    class Config:
        from_attributes = True


class CheckupItemBase(BaseModel):
    item_name: str
    department: str
    status: str = "pending"
    result: Optional[str] = None


class CheckupItemOut(CheckupItemBase):
    id: int
    record_id: int
    operator_id: Optional[int] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CheckupRecordBase(BaseModel):
    patient_id: int
    checkup_date: date
    status: str = "pending"


class CheckupRecordCreate(CheckupRecordBase):
    pass


class CheckupRecordOut(CheckupRecordBase):
    id: int

    class Config:
        from_attributes = True


class CheckupRecordDetail(CheckupRecordOut):
    items: List[CheckupItemOut] = []
    patient_name: Optional[str] = None


class AbnormalIndicatorBase(BaseModel):
    item_id: int
    record_id: int
    indicator_name: str
    indicator_value: str
    reference_range: str
    severity: str


class AbnormalIndicatorCreate(AbnormalIndicatorBase):
    pass


class AbnormalIndicatorOut(AbnormalIndicatorBase):
    id: int
    discovered_at: datetime

    class Config:
        from_attributes = True


class AbnormalIndicatorWithRecommendations(AbnormalIndicatorOut):
    has_recommendation: bool
    recommendation_count: int
    patient_name: Optional[str] = None
    item_name: Optional[str] = None


class FollowUpRecommendationBase(BaseModel):
    indicator_id: int
    record_id: int
    recommendation: str
    follow_up_type: str
    deadline: Optional[date] = None
    created_by: int


class FollowUpRecommendationCreate(FollowUpRecommendationBase):
    pass


class FollowUpRecommendationUpdate(BaseModel):
    recommendation: Optional[str] = None
    follow_up_type: Optional[str] = None
    deadline: Optional[date] = None
    is_completed: Optional[int] = None


class FollowUpRecommendationOut(FollowUpRecommendationBase):
    id: int
    created_at: datetime
    is_completed: int

    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    record_id: int
    patient_id: int
    type: str
    channel: str
    content: str


class NotificationCreate(NotificationBase):
    sent_by: Optional[int] = None


class GuideNotifyMissedCreate(BaseModel):
    record_id: int
    patient_id: int
    channel: str
    content: str
    sent_by: int


class NotificationOut(NotificationBase):
    id: int
    status: str
    sent_by: Optional[int] = None
    sent_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationWithSenderOut(NotificationOut):
    sender_name: Optional[str] = None


class ReportBase(BaseModel):
    record_id: int


class ReportCreate(ReportBase):
    pass


class ReportOut(ReportBase):
    id: int
    status: str
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_comment: Optional[str] = None
    released_by: Optional[int] = None
    released_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportReviewAction(BaseModel):
    action: str
    reviewer_id: int
    comment: Optional[str] = None


class ReportReleaseAction(BaseModel):
    releaser_id: int


class GuidePendingCheckupOut(BaseModel):
    record_id: int
    patient_name: str
    patient_phone: str
    checkup_date: date
    missed_items: List[str]
    notification_sent: bool
    notification_status: Optional[str] = None


class IndicatorRecommendationMatchOut(BaseModel):
    indicator_id: int
    indicator_name: str
    severity: str
    has_recommendation: bool
    recommendation_count: int
    is_completed: bool
    match_status: str


class ReportDetailOut(BaseModel):
    report: ReportOut
    patient_name: str
    checkup_date: date
    record_status: str
    abnormal_indicators: List[AbnormalIndicatorOut]
    recommendations: List[FollowUpRecommendationOut]
    all_items_completed: bool
    all_indicators_have_recommendations: bool
