from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    username: str
    name: str
    role: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class TenantBase(BaseModel):
    name: str
    shop_number: str
    contact: str
    phone: str


class TenantCreate(TenantBase):
    pass


class TenantUpdate(TenantBase):
    status: Optional[str] = None


class Tenant(TenantBase):
    id: int
    status: str
    created_at: datetime
    created_by: int
    creator: Optional[User] = None

    class Config:
        from_attributes = True


class TenantReview(BaseModel):
    status: str
    remark: Optional[str] = None


class LicenseBase(BaseModel):
    tenant_id: int
    license_type: str
    license_number: str
    expire_date: str


class LicenseCreate(LicenseBase):
    pass


class LicenseUpdate(LicenseBase):
    status: Optional[str] = None


class License(LicenseBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class LicenseReview(BaseModel):
    status: str
    remark: Optional[str] = None


class ActivityBase(BaseModel):
    tenant_id: int
    title: str
    content: str
    start_date: str
    end_date: str


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(ActivityBase):
    status: Optional[str] = None


class Activity(ActivityBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityReview(BaseModel):
    status: str
    remark: Optional[str] = None


class ComplaintBase(BaseModel):
    tenant_id: int
    title: str
    content: str


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintUpdate(ComplaintBase):
    status: Optional[str] = None
    handler: Optional[int] = None


class Complaint(ComplaintBase):
    id: int
    status: str
    handler: Optional[int] = None
    created_at: datetime
    handler_user: Optional[User] = None

    class Config:
        from_attributes = True


class ComplaintHandle(BaseModel):
    status: str
    remark: Optional[str] = None


class HistoryRecordBase(BaseModel):
    related_type: str
    related_id: int
    action: str
    remark: Optional[str] = None
    operator_name: str


class HistoryRecordCreate(HistoryRecordBase):
    pass


class HistoryRecord(HistoryRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
