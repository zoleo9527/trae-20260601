from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    name: str
    role: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class StatusLogResponse(BaseModel):
    id: int
    from_status: str
    to_status: str
    operator: str
    operator_role: str
    operated_at: datetime
    remark: str

    class Config:
        from_attributes = True


class FeedingPlanBase(BaseModel):
    pond_no: str
    breed_type: str
    feed_type: str
    daily_amount: float
    frequency: int
    start_date: str
    end_date: str
    remark: Optional[str] = ""


class FeedingPlanCreate(FeedingPlanBase):
    pass


class FeedingPlanUpdate(BaseModel):
    pond_no: Optional[str] = None
    breed_type: Optional[str] = None
    feed_type: Optional[str] = None
    daily_amount: Optional[float] = None
    frequency: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    remark: Optional[str] = None


class FeedingPlanResponse(FeedingPlanBase):
    id: int
    plan_no: str
    status: str
    created_by: str
    created_at: datetime
    status_logs: List[StatusLogResponse] = []

    class Config:
        from_attributes = True


class FeedRequisitionBase(BaseModel):
    feeding_plan_id: int
    pond_no: str
    feed_type: str
    amount: float
    remark: Optional[str] = ""


class FeedRequisitionCreate(FeedRequisitionBase):
    pass


class FeedRequisitionResponse(FeedRequisitionBase):
    id: int
    req_no: str
    status: str
    requested_by: str
    requested_at: datetime
    issued_by: str
    issued_at: Optional[datetime] = None
    received_by: str
    received_at: Optional[datetime] = None
    status_logs: List[StatusLogResponse] = []

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str
    remark: Optional[str] = ""
